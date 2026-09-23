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
  ["Nike Store", "Jan Jansen", "sales@nike.nl", "020-1234567", "sneakersverkoper"],
  ["Side Kicks", "Fatima El Amrani", "info@sidekicks.nl", "010-7654321", "side-stand"],
  ["Vintage Vault", "Lisa de Boer", "vault@example.com", "030-1112233", "sneakersverkoper"],
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
          (Bedrijfsnaam, Contactpersoon, Email, Telefoon, Verkopertype)
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
  assert.equal(inhoud.length, 3);
});

test("zoekt op bedrijfsnaam zonder hoofdlettergevoeligheid", async () => {
  const { inhoud } = await verstuurGetRequest("?zoek=NIKE");

  assert.deepEqual(inhoud.map((verkoper) => verkoper.bedrijfsnaam), ["Nike Store"]);
});

test("zoekt op contactpersoon", async () => {
  const { inhoud } = await verstuurGetRequest("?zoek=fatima");

  assert.deepEqual(inhoud.map((verkoper) => verkoper.bedrijfsnaam), ["Side Kicks"]);
});

test("zoekt op email", async () => {
  const { inhoud } = await verstuurGetRequest("?zoek=vault%40example.com");

  assert.deepEqual(inhoud.map((verkoper) => verkoper.bedrijfsnaam), ["Vintage Vault"]);
});

test("filtert op type verkoper", async () => {
  const { inhoud } = await verstuurGetRequest("?type=sneakersverkoper");

  assert.deepEqual(
    inhoud.map((verkoper) => verkoper.bedrijfsnaam),
    ["Nike Store", "Vintage Vault"],
  );
});

test("combineert zoeken en filteren", async () => {
  const { inhoud } = await verstuurGetRequest(
    "?zoek=nike&type=sneakersverkoper",
  );

  assert.deepEqual(inhoud.map((verkoper) => verkoper.bedrijfsnaam), ["Nike Store"]);
});

test("empty: geeft een lege lijst zonder resultaten", async () => {
  const { response, inhoud } = await verstuurGetRequest("?zoek=onbekend");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud, []);
});

test("unhappy: weigert een ongeldig type verkoper", async () => {
  const { response, inhoud } = await verstuurGetRequest("?type=restaurant");

  assert.equal(response.status, 400);
  assert.deepEqual(inhoud, { error: "Ongeldig type verkoper." });
});

test("database weigert een ongeldig verkopertype", async () => {
  const database = await initialiseerDatabase();

  try {
    await assert.rejects(
      voerQueryUit(
        database,
        `INSERT INTO Verkoper
          (Bedrijfsnaam, Contactpersoon, Email, Telefoon, Verkopertype)
         VALUES (?, ?, ?, ?, ?)`,
        ["Testzaak", "Test Persoon", "test@example.nl", "0612345678", "restaurant"],
      ),
      /CHECK constraint failed/,
    );
  } finally {
    await sluitDatabase(database);
  }
});

test("Isactief krijgt standaard waarde 1", async () => {
  const database = await initialiseerDatabase();

  try {
    const [verkoper] = await haalRijenOp(
      database,
      "SELECT Isactief FROM Verkoper WHERE Bedrijfsnaam = ?",
      ["Nike Store"],
    );

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
    "bedrijfsnaam",
    "contactpersoon",
    "email",
    "id",
    "telefoon",
    "type_verkoper",
  ]);
});
