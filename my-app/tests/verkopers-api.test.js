import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { GET } from "../app/api/verkopers/route.js";
import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
  voerQueryUit,
} from "../app/lib/database.js";

let tijdelijkeMap;

const testVerkopers = [
  ["Nike Store", 1, "Sneakers", 2, "/logos/nike.svg"],
  ["Side Kicks", 0, "Kids Corner", 1, null],
  ["Food District", 0, "Eten en Drinken", 2, null],
];

before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "verkopers-api-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite");

  const database = await initialiseerDatabase();

  try {
    for (const verkoper of testVerkopers) {
      await voerQueryUit(
        database,
        `INSERT INTO Verkoper
          (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
         VALUES (?, ?, ?, ?, ?)`,
        verkoper,
      );
    }
  } finally {
    await sluitDatabase(database);
  }
});

after(async () => {
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

async function verstuurGetRequest(query = "") {
  const response = await GET(new Request(`http://localhost/api/verkopers${query}`));
  return { response, inhoud: await response.json() };
}

test("happy: haalt alle verkopers op", async () => {
  const { response, inhoud } = await verstuurGetRequest();

  assert.equal(response.status, 200);
  assert.equal(inhoud.length, testVerkopers.length);
});

test("zoekt op naam zonder hoofdlettergevoeligheid", async () => {
  const { response, inhoud } = await verstuurGetRequest("?zoek=NIKE");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((verkoper) => verkoper.naam), ["Nike Store"]);
});

test("zoekt op verkoopsoort", async () => {
  const { response, inhoud } = await verstuurGetRequest("?zoek=eten");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((verkoper) => verkoper.naam), ["Food District"]);
});

test("filtert op aantal dagen", async () => {
  const { response, inhoud } = await verstuurGetRequest("?dagen=1");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((verkoper) => verkoper.naam), ["Side Kicks"]);
});

test("filtert op speciale status", async () => {
  const { response, inhoud } = await verstuurGetRequest("?specialeStatus=true");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((verkoper) => verkoper.naam), ["Nike Store"]);
  assert.equal(inhoud[0].specialeStatus, true);
});

test("combineert zoeken en filters", async () => {
  const { response, inhoud } = await verstuurGetRequest(
    "?zoek=sneakers&dagen=2&specialeStatus=true",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((verkoper) => verkoper.naam), ["Nike Store"]);
});

test("empty: geeft een lege lijst zonder resultaten", async () => {
  const { response, inhoud } = await verstuurGetRequest("?zoek=onbekend");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud, []);
});

test("unhappy: weigert een ongeldig aantal dagen", async () => {
  const { response, inhoud } = await verstuurGetRequest("?dagen=3");

  assert.equal(response.status, 400);
  assert.deepEqual(inhoud, { error: "Ongeldig aantal dagen." });
});

test("unhappy: weigert een ongeldige speciale status", async () => {
  const { response, inhoud } = await verstuurGetRequest("?specialeStatus=partner");

  assert.equal(response.status, 400);
  assert.deepEqual(inhoud, { error: "Ongeldige speciale status." });
});

test("database accepteert alleen SpecialeStatus 0 of 1", async () => {
  const database = await initialiseerDatabase();

  try {
    await assert.rejects(
      voerQueryUit(
        database,
        `INSERT INTO Verkoper
          (Naam, SpecialeStatus, VerkooptSoort, Dagen)
         VALUES (?, ?, ?, ?)`,
        ["Testzaak", 2, "Sneakers", 1],
      ),
      /CHECK constraint failed/,
    );
  } finally {
    await sluitDatabase(database);
  }
});

test("database accepteert alleen 1 of 2 dagen", async () => {
  const database = await initialiseerDatabase();

  try {
    await assert.rejects(
      voerQueryUit(
        database,
        `INSERT INTO Verkoper
          (Naam, VerkooptSoort, Dagen)
         VALUES (?, ?, ?)`,
        ["Testzaak", "Sneakers", 3],
      ),
      /CHECK constraint failed/,
    );
  } finally {
    await sluitDatabase(database);
  }
});

test("Logo mag null zijn en Isactief krijgt standaard waarde 1", async () => {
  const database = await initialiseerDatabase();

  try {
    const [verkoper] = await haalRijenOp(
      database,
      "SELECT Logo, Isactief FROM Verkoper WHERE Naam = ?",
      ["Side Kicks"],
    );

    assert.equal(verkoper.Logo, null);
    assert.equal(verkoper.Isactief, 1);
  } finally {
    await sluitDatabase(database);
  }
});

test("tests gebruiken een aparte tijdelijke database", () => {
  const normaleDatabasePad = path.join(process.cwd(), "data", "sneakerness.sqlite");

  assert.notEqual(process.env.SQLITE_DATABASE_PATH, normaleDatabasePad);
  assert.ok(process.env.SQLITE_DATABASE_PATH.startsWith(tijdelijkeMap));
});

test("stuurt alleen de afgesproken responsevelden terug", async () => {
  const { inhoud } = await verstuurGetRequest("?zoek=nike");

  assert.deepEqual(Object.keys(inhoud[0]).sort(), [
    "dagen",
    "id",
    "logo",
    "naam",
    "specialeStatus",
    "verkooptSoort",
  ]);
});
