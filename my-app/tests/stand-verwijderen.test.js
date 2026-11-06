import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { DELETE } from "../app/api/stands/[id]/verwijderen/route.js";
import { GET as haalStandOp } from "../app/api/stands/[id]/route.js";
import { GET as haalStandsOp } from "../app/api/stands/route.js";
import { POST as reserveerStand } from "../app/api/stands/reserveringen/route.js";
import { initialiseerDatabase, initialiseerVoorbeelddata, haalRijenOp, voerQueryUit, sluitDatabase } from "../lib/database/db.js";
import { meldingStandVerwijderenSucces, meldingStandVerwijderenFout } from "../lib/stand-verwijderen-meldingen.js";

let tijdelijkeMap;
const context = id => ({ params: Promise.resolve({ id: String(id) }) });
function verstuurVerwijdering(id, invoer = { bevestigd: true }) {
  return DELETE(new Request(`http://localhost/api/stands/${id}/verwijderen`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoer) }), context(id));
}
async function metDatabase(actie) {
  const database = await initialiseerDatabase();
  try { return await actie(database); } finally { await sluitDatabase(database); }
}
async function leesStand(id) {
  return metDatabase(database => haalRijenOp(database, "SELECT * FROM Stand WHERE Id = ?", [id]));
}
before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "stand-verwijderen-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite3");
  await metDatabase(async database => {
    await voerQueryUit(database, "INSERT INTO Verkoper (Naam, VerkooptSoort, Dagen) VALUES ('Testverkoper', 'Sneakers', 2)");
    for (let id = 1; id <= 9; id++) await voerQueryUit(database, "INSERT INTO Stand (Id, Standnummer, Standtype, Locatie, Grootte, PrijsCenten) VALUES (?, ?, 'aa', 'Hal 1', 10, 10000)", [id, `R0${id}`]);
    await voerQueryUit(database, "UPDATE Stand SET VerkoperId = 1, Status = 'Gereserveerd' WHERE Id = 2");
    await voerQueryUit(database, "UPDATE Stand SET VerkoperId = 1 WHERE Id = 3");
    await voerQueryUit(database, "UPDATE Stand SET Status = 'Gereserveerd' WHERE Id = 5");
    for (const standId of [2, 8]) await voerQueryUit(database, "INSERT INTO StandReservering (StandId, Evenementdatum, Startdatum, Einddatum) VALUES (?, '2026-11-10', '2026-11-10', '2026-11-11')", [standId]);
  });
});
after(async () => {
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

test("ophalen voor bevestiging wijzigt of verwijdert niets", async () => {
  const voor = await leesStand(1);
  const antwoord = await haalStandOp(new Request("http://localhost/api/stands/1"), context(1));
  assert.equal(antwoord.status, 200);
  assert.equal((await antwoord.json()).stand.standnummer, "R01");
  assert.deepEqual(await leesStand(1), voor);
});
test("zonder expliciete bevestiging wordt niets verwijderd", async () => {
  const voor = await leesStand(1);
  for (const invoer of [{}, null, [], { bevestigd: false }, { bevestigd: "true" }, { bevestigd: 1 }]) {
    assert.equal((await verstuurVerwijdering(1, invoer)).status, 400);
  }
  assert.deepEqual(await leesStand(1), voor);
});
test("ongeldige JSON en ids worden geweigerd zonder gegevensverlies", async () => {
  const antwoord = await DELETE(new Request("http://localhost/api/stands/1/verwijderen", { method: "DELETE", body: "{" }), context(1));
  assert.equal(antwoord.status, 400);
  for (const id of ["x", "0", "-1", "1.5", "1e2", "9007199254740992", "1 OR 1=1"]) assert.equal((await verstuurVerwijdering(id)).status, 400);
  assert.equal((await leesStand(1)).length, 1);
});
test("happy: stand is definitief verwijderd en succesmelding is exact", async () => {
  const antwoord = await verstuurVerwijdering(1);
  assert.equal(antwoord.status, 200);
  assert.deepEqual(await antwoord.json(), { id: 1, message: meldingStandVerwijderenSucces });
  assert.deepEqual(await leesStand(1), []);
  const overzicht = await haalStandsOp(new Request("http://localhost/api/stands"));
  assert.ok(!(await overzicht.json()).some(stand => stand.id === 1));
  assert.equal((await haalStandOp(new Request("http://localhost/api/stands/1"), context(1))).status, 404);
  await metDatabase(async database => assert.equal((await haalRijenOp(database, "SELECT * FROM Verkoper")).length, 1));
});
test("opnieuw verwijderen en onbekende stand geven 404", async () => {
  for (const id of [1, 999]) assert.equal((await verstuurVerwijdering(id)).status, 404);
});
test("verkoperkoppeling, reservering of gereserveerde status blokkeren verwijderen", async () => {
  for (const id of [2, 3, 5, 8]) {
    const voor = await leesStand(id);
    const antwoord = await verstuurVerwijdering(id);
    assert.equal(antwoord.status, 409);
    assert.match((await antwoord.json()).error, /verkoperkoppeling of reservering/);
    assert.deepEqual(await leesStand(id), voor);
  }
  await metDatabase(async database => {
    assert.equal((await haalRijenOp(database, "SELECT * FROM StandReservering")).length, 2);
    assert.equal((await haalRijenOp(database, "SELECT * FROM Verkoper")).length, 1);
  });
});
test("unhappy: opslagfout houdt de stand volledig intact", async () => {
  const voor = await leesStand(4);
  await metDatabase(database => voerQueryUit(database, "CREATE TRIGGER test_stand_verwijderen_fout AFTER DELETE ON Stand WHEN OLD.Id = 4 BEGIN SELECT RAISE(ABORT, 'testfout'); END"));
  try {
    const antwoord = await verstuurVerwijdering(4);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingStandVerwijderenFout });
    assert.deepEqual(await leesStand(4), voor);
  } finally { await metDatabase(database => voerQueryUit(database, "DROP TRIGGER test_stand_verwijderen_fout")); }
});
test("unhappy: databasefout geeft exacte melding en na herstel bestaat de stand nog", async () => {
  const voor = await leesStand(4);
  process.env.FORCE_DB_ERROR = "1";
  try {
    const antwoord = await verstuurVerwijdering(4);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingStandVerwijderenFout });
  } finally { delete process.env.FORCE_DB_ERROR; }
  assert.deepEqual(await leesStand(4), voor);
});
test("gelijktijdig verwijderen geeft eenmaal succes en eenmaal niet gevonden", async () => {
  const antwoorden = await Promise.all([verstuurVerwijdering(6), verstuurVerwijdering(6)]);
  assert.deepEqual(antwoorden.map(antwoord => antwoord.status).sort(), [200, 404]);
  assert.deepEqual(await leesStand(6), []);
});
test("reserveren tijdens verwijderen veroorzaakt geen verdwenen reservering", async () => {
  const [verwijderen, reserveren] = await Promise.all([
    verstuurVerwijdering(7),
    reserveerStand(new Request("http://localhost/api/stands/reserveringen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ standId: 7, verkoperId: 1, evenementdatum: "2026-11-10", startdatum: "2026-11-10", einddatum: "2026-11-11", opmerking: "Bewaren" }) })),
  ]);
  assert.ok((verwijderen.status === 200 && reserveren.status === 409) || (verwijderen.status === 409 && reserveren.status === 201));
  const stand = await leesStand(7);
  if (reserveren.status === 201) {
    assert.equal(stand[0].VerkoperId, 1);
    assert.equal((await metDatabase(database => haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 7"))).length, 1);
  } else assert.deepEqual(stand, []);
});
test("andere stands en de verkoper blijven ongewijzigd bij verwijderen", async () => {
  const andereStand = await leesStand(9);
  const verkopers = await metDatabase(database => haalRijenOp(database, "SELECT * FROM Verkoper"));
  assert.equal((await verstuurVerwijdering(4)).status, 200);
  assert.deepEqual(await leesStand(9), andereStand);
  assert.deepEqual(await metDatabase(database => haalRijenOp(database, "SELECT * FROM Verkoper")), verkopers);
});
test("SQLite-integriteit en foreign keys blijven geldig in een geïsoleerde database", async () => {
  await metDatabase(async database => {
    assert.deepEqual(await haalRijenOp(database, "PRAGMA integrity_check"), [{ integrity_check: "ok" }]);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA foreign_key_check"), []);
    assert.ok((await haalRijenOp(database, "PRAGMA database_list"))[0].file.startsWith(tijdelijkeMap));
  });
});
test("verwijderde voorbeeldstand keert niet terug bij opnieuw initialiseren", async () => {
  const oorspronkelijkPad = process.env.SQLITE_DATABASE_PATH;
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "seed.sqlite3");
  try {
    await metDatabase(database => initialiseerVoorbeelddata(database));
    const [voorbeeld] = await metDatabase(database => haalRijenOp(database, "SELECT Id FROM Stand WHERE Standnummer = 'A01'"));
    assert.equal((await verstuurVerwijdering(voorbeeld.Id)).status, 200);
    await metDatabase(database => initialiseerVoorbeelddata(database));
    await metDatabase(database => initialiseerVoorbeelddata(database));
    assert.deepEqual(await metDatabase(database => haalRijenOp(database, "SELECT * FROM Stand WHERE Standnummer = 'A01'")), []);
    assert.equal((await metDatabase(database => haalRijenOp(database, "SELECT * FROM Stand"))).length, 5);
  } finally { process.env.SQLITE_DATABASE_PATH = oorspronkelijkPad; }
});
