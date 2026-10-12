import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { GET, POST } from "../app/api/verkopers/route.js";
import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
  voerQueryUit,
} from "../lib/database/db.js";

let tijdelijkeMap;

const nieuweVerkoper = {
  naam: "Nieuwe Sneakerzaak",
  contactpersoon: "Sam de Vries",
  email: "sam@example.nl",
  telefoon: "0612345678",
  adres: "Voorbeeldstraat 12",
  postcode: "1234 AB",
  plaats: "Rotterdam",
  verkooptSoort: "Nieuwe categorie",
  dagen: 2,
  opmerking: "Voorbeeldopmerking",
};

function verstuurPostRequest(invoer) {
  return POST(new Request("http://localhost/api/verkopers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoer),
  }));
}

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

test("toevoegen: ontbrekende velden geven 400 zonder opslag", async () => {
  const antwoord = await verstuurPostRequest({});
  assert.equal(antwoord.status, 400);
  const inhoud = await antwoord.json();
  assert.ok(inhoud.fouten.naam);
  assert.ok(inhoud.fouten.contactpersoon);
  assert.ok(inhoud.fouten.email);
  const { inhoud: verkopers } = await verstuurGetRequest();
  assert.equal(verkopers.length, testVerkopers.length);
});

test("toevoegen: ongeldig e-mailadres en dagen worden geweigerd", async () => {
  const antwoord = await verstuurPostRequest({ ...nieuweVerkoper, email: "ongeldig", dagen: 3 });
  assert.equal(antwoord.status, 400);
  const inhoud = await antwoord.json();
  assert.ok(inhoud.fouten.email);
  assert.ok(inhoud.fouten.dagen);
});

test("toevoegen: ongeldige JSON geeft 400", async () => {
  const antwoord = await POST(new Request("http://localhost/api/verkopers", { method: "POST", body: "{" }));
  assert.equal(antwoord.status, 400);
});

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
  const normaleDatabasePad = path.join(
    process.cwd(),
    "lib",
    "database",
    "sneakerness.sqlite3",
  );

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

test("toevoegen: verkoper en gekoppelde contactpersoon worden opgeslagen", async () => {
  const antwoord = await verstuurPostRequest(nieuweVerkoper);
  assert.equal(antwoord.status, 201);
  const { id } = await antwoord.json();
  const { inhoud } = await verstuurGetRequest("?zoek=Nieuwe%20Sneakerzaak");
  assert.equal(inhoud[0].id, id);
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(database, `
      SELECT v.Adres, v.Postcode, v.Plaats, c.Email FROM Verkoper v
      JOIN Contactpersoonverkoper k ON k.VerkoperId = v.Id
      JOIN contactpersonen c ON c.id = k.ContactpersoonId WHERE v.Id = ?
    `, [id]);
    assert.equal(rijen[0].Email, nieuweVerkoper.email);
    assert.equal(rijen[0].Adres, nieuweVerkoper.adres);
  } finally {
    await sluitDatabase(database);
  }
});

test("toevoegen: mislukte koppeling draait verkoper en contactpersoon terug", async () => {
  const database = await initialiseerDatabase();
  try {
    await voerQueryUit(database, `CREATE TRIGGER weigerKoppeling BEFORE INSERT ON Contactpersoonverkoper
      BEGIN SELECT RAISE(ABORT, 'testfout'); END`);
    const antwoord = await verstuurPostRequest({ ...nieuweVerkoper, naam: "Rollbackzaak", email: "rollback@example.nl" });
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await haalRijenOp(database, "SELECT Id FROM Verkoper WHERE Naam = 'Rollbackzaak'"), []);
    assert.deepEqual(await haalRijenOp(database, "SELECT id FROM contactpersonen WHERE Email = 'rollback@example.nl'"), []);
  } finally {
    await voerQueryUit(database, "DROP TRIGGER IF EXISTS weigerKoppeling");
    await sluitDatabase(database);
  }
});

test("gelijktijdige eerste aanvragen initialiseren iedere adreskolom één keer", async () => {
  const oorspronkelijkPad = process.env.SQLITE_DATABASE_PATH;
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "gelijktijdig.sqlite");
  try {
    await Promise.all(Array.from({ length: 6 }, async () => {
      const database = await initialiseerDatabase();
      try {
        const kolommen = await haalRijenOp(database, "PRAGMA table_info(Verkoper)");
        for (const naam of ["Adres", "Postcode", "Plaats"]) {
          assert.equal(kolommen.filter((kolom) => kolom.name === naam).length, 1);
        }
        const integriteit = await haalRijenOp(database, "PRAGMA integrity_check");
        assert.equal(integriteit[0].integrity_check, "ok");
      } finally {
        await sluitDatabase(database);
      }
    }));
  } finally {
    process.env.SQLITE_DATABASE_PATH = oorspronkelijkPad;
  }
});
