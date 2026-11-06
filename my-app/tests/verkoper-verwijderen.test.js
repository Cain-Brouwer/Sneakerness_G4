import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { DELETE } from "../app/api/verkopers/[id]/verwijderen/route.js";
import { DELETE as ontkoppelContactpersoon } from "../app/api/verkopers/[id]/route.js";
import { GET as haalVerkopersOp } from "../app/api/verkopers/route.js";
import { initialiseerDatabase, initialiseerVoorbeelddata, haalRijenOp, voerQueryUit, sluitDatabase } from "../lib/database/db.js";
import { meldingVerwijderenSucces, meldingVerwijderenFout } from "../lib/verkoper-verwijderen-validatie.js";

let tijdelijkeMap;
const context = id => ({ params: Promise.resolve({ id: String(id) }) });
function verstuurVerwijdering(id, invoer = { bevestigd: true }) {
  return DELETE(new Request(`http://localhost/api/verkopers/${id}/verwijderen`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoer) }), context(id));
}
async function metDatabase(actie) {
  const database = await initialiseerDatabase();
  try { return await actie(database); } finally { await sluitDatabase(database); }
}
async function leesVerkoper(id) {
  return metDatabase(database => haalRijenOp(database, "SELECT * FROM Verkoper WHERE Id = ?", [id]));
}
before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "verkoper-verwijderen-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite3");
  await metDatabase(async database => {
    for (let id = 1; id <= 6; id++) await voerQueryUit(database, "INSERT INTO Verkoper (Id, Naam, VerkooptSoort, Dagen) VALUES (?, ?, 'Sneakers', 2)", [id, `Bedrijf ${id}`]);
    for (let id = 1; id <= 3; id++) await voerQueryUit(database, "INSERT INTO contactpersonen (id, Naam, Email) VALUES (?, ?, ?)", [id, `Contact ${id}`, `contact${id}@example.nl`]);
    await voerQueryUit(database, "INSERT INTO verkoper_contactpersoon (VerkoperId, ContactpersoonId) VALUES (1, 1), (2, 1), (4, 2), (5, 3)");
    await voerQueryUit(database, "INSERT INTO Contactpersoonverkoper (VerkoperId, ContactpersoonId) VALUES (1, 1), (4, 2), (5, 3)");
    await voerQueryUit(database, "INSERT INTO Stand (Standnummer, Standtype, VerkoperId, Status) VALUES ('A01', 'aa', 3, 'Gereserveerd')");
    await voerQueryUit(database, "INSERT INTO StandReservering (StandId, Evenementdatum, Startdatum, Einddatum) VALUES (1, '2026-11-10', '2026-11-10', '2026-11-11')");
  });
});
after(async () => {
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

test("zonder expliciete bevestiging wordt niets verwijderd", async () => {
  const voor = await leesVerkoper(1);
  for (const invoer of [{}, null, [], { bevestigd: false }, { bevestigd: "true" }, { bevestigd: 1 }]) {
    assert.equal((await verstuurVerwijdering(1, invoer)).status, 400);
  }
  assert.deepEqual(await leesVerkoper(1), voor);
});
test("ongeldige JSON en ids worden geweigerd", async () => {
  const antwoord = await DELETE(new Request("http://localhost/api/verkopers/1/verwijderen", { method: "DELETE", body: "{" }), context(1));
  assert.equal(antwoord.status, 400);
  for (const id of ["x", "0", "-1", "1.5", "1e2", "9007199254740992", "1 OR 1=1"]) assert.equal((await verstuurVerwijdering(id)).status, 400);
  assert.equal((await leesVerkoper(1)).length, 1);
});
test("happy: verwijdert verkoper en beide soorten koppelingen met exacte succesmelding", async () => {
  const antwoord = await verstuurVerwijdering(1);
  assert.equal(antwoord.status, 200);
  assert.deepEqual(await antwoord.json(), { id: 1, message: meldingVerwijderenSucces });
  assert.deepEqual(await leesVerkoper(1), []);
  await metDatabase(async database => {
    for (const tabel of ["verkoper_contactpersoon", "Contactpersoonverkoper"]) assert.deepEqual(await haalRijenOp(database, `SELECT * FROM ${tabel} WHERE VerkoperId = 1`), []);
    assert.equal((await haalRijenOp(database, "SELECT * FROM contactpersonen WHERE id = 1")).length, 1);
    assert.equal((await haalRijenOp(database, "SELECT * FROM verkoper_contactpersoon WHERE VerkoperId = 2 AND ContactpersoonId = 1")).length, 1);
  });
  const overzicht = await haalVerkopersOp(new Request("http://localhost/api/verkopers"));
  assert.ok(!(await overzicht.json()).some(verkoper => verkoper.id === 1));
});
test("opnieuw verwijderen en niet-bestaande verkoper geven 404", async () => {
  for (const id of [1, 999]) assert.equal((await verstuurVerwijdering(id)).status, 404);
});
test("gekoppelde stands blokkeren verwijderen en behouden reserveringen", async () => {
  const voor = await leesVerkoper(3);
  const antwoord = await verstuurVerwijdering(3);
  assert.equal(antwoord.status, 409);
  assert.match((await antwoord.json()).error, /gekoppelde stands/);
  assert.deepEqual(await leesVerkoper(3), voor);
  await metDatabase(async database => {
    assert.deepEqual(await haalRijenOp(database, "SELECT VerkoperId, Status FROM Stand WHERE Id = 1"), [{ VerkoperId: 3, Status: "Gereserveerd" }]);
    assert.equal((await haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 1")).length, 1);
  });
});
test("fout bij verwijderen draait ook verwijderde contactkoppelingen terug", async () => {
  const voor = await leesVerkoper(4);
  await metDatabase(database => voerQueryUit(database, "CREATE TRIGGER test_verwijderen_fout BEFORE DELETE ON Verkoper WHEN OLD.Id = 4 BEGIN SELECT RAISE(ABORT, 'testfout'); END"));
  try {
    const antwoord = await verstuurVerwijdering(4);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingVerwijderenFout });
    assert.deepEqual(await leesVerkoper(4), voor);
    await metDatabase(async database => {
      for (const tabel of ["verkoper_contactpersoon", "Contactpersoonverkoper"]) assert.equal((await haalRijenOp(database, `SELECT * FROM ${tabel} WHERE VerkoperId = 4`)).length, 1);
    });
  } finally { await metDatabase(database => voerQueryUit(database, "DROP TRIGGER test_verwijderen_fout")); }
});
test("unhappy: databasefout geeft exacte foutmelding zonder gegevensverlies", async () => {
  const voor = await leesVerkoper(2);
  process.env.FORCE_DB_ERROR = "1";
  try {
    const antwoord = await verstuurVerwijdering(2);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingVerwijderenFout });
  } finally { delete process.env.FORCE_DB_ERROR; }
  assert.deepEqual(await leesVerkoper(2), voor);
});
test("bestaande DELETE-route blijft alleen contactpersoon ontkoppelen", async () => {
  const antwoord = await ontkoppelContactpersoon(new Request("http://localhost/api/verkopers/5", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactpersoonId: 3 }) }), context(5));
  assert.equal(antwoord.status, 200);
  assert.equal((await leesVerkoper(5)).length, 1);
  await metDatabase(async database => assert.equal((await haalRijenOp(database, "SELECT * FROM contactpersonen WHERE id = 3")).length, 1));
});
test("gelijktijdig verwijderen geeft eenmaal succes, daarna niet gevonden", async () => {
  const antwoorden = await Promise.all([verstuurVerwijdering(6), verstuurVerwijdering(6)]);
  assert.deepEqual(antwoorden.map(antwoord => antwoord.status).sort(), [200, 404]);
  assert.deepEqual(await leesVerkoper(6), []);
});
test("testdatabase is geïsoleerd en foreign keys en integriteit blijven geldig", async () => {
  await metDatabase(async database => {
    assert.ok((await haalRijenOp(database, "PRAGMA database_list"))[0].file.startsWith(tijdelijkeMap));
    assert.deepEqual(await haalRijenOp(database, "PRAGMA foreign_key_check"), []);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA integrity_check"), [{ integrity_check: "ok" }]);
    assert.deepEqual(await haalRijenOp(database, "SELECT name FROM sqlite_master WHERE name = 'OntwikkelSeed'"), []);
  });
});
test("verwijderde voorbeeldverkopers keren niet terug na opnieuw initialiseren of seeden", async () => {
  const oorspronkelijkPad = process.env.SQLITE_DATABASE_PATH;
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "seed-controle.sqlite3");
  try {
    await metDatabase(database => initialiseerVoorbeelddata(database));
    let voorbeeldId;
    await metDatabase(async database => {
      const [voorbeeld] = await haalRijenOp(database, "SELECT Id FROM Verkoper WHERE Naam = 'Sneaker District'");
      voorbeeldId = voorbeeld.Id;
      assert.equal((await haalRijenOp(database, "SELECT * FROM Verkoper")).length, 6);
    });
    assert.equal((await verstuurVerwijdering(voorbeeldId)).status, 200);
    for (let poging = 0; poging < 2; poging++) await metDatabase(database => initialiseerVoorbeelddata(database));
    await metDatabase(async database => {
      assert.deepEqual(await haalRijenOp(database, "SELECT * FROM Verkoper WHERE Naam = 'Sneaker District'"), []);
      assert.equal((await haalRijenOp(database, "SELECT * FROM Verkoper")).length, 5);
      assert.equal((await haalRijenOp(database, "SELECT * FROM OntwikkelSeed")).length, 1);
    });
  } finally { process.env.SQLITE_DATABASE_PATH = oorspronkelijkPad; }
});
