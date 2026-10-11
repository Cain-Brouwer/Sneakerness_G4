import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { GET, POST } from "../app/api/stands/reserveringen/route.js";
import { initialiseerDatabase, voerQueryUit, haalRijenOp, sluitDatabase } from "../lib/database/db.js";

let tijdelijkeMap;
const aanvraag = { verkoperId: 1, standId: 1, evenementdatum: "2026-11-01", startdatum: "2026-11-01", einddatum: "2026-11-02", opmerking: "Bij de ingang" };
function verstuurReservering(invoer = aanvraag) {
  return POST(new Request("http://localhost/api/stands/reserveringen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoer) }));
}
async function metDatabase(actie) {
  const database = await initialiseerDatabase();
  try { return await actie(database); } finally { await sluitDatabase(database); }
}
before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "stand-reserveren-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite3");
  await metDatabase(async database => {
    for (const [id, actief] of [[1, 1], [2, 1], [3, 0]]) {
      await voerQueryUit(database, "INSERT INTO Verkoper (Id, Naam, VerkooptSoort, Dagen, Isactief) VALUES (?, ?, 'Sneakers', 2, ?)", [id, `Verkoper ${id}`, actief]);
    }
    for (let id = 1; id <= 8; id++) {
      await voerQueryUit(database, "INSERT INTO Stand (Id, Standnummer, Standtype, Locatie, PrijsCenten) VALUES (?, ?, 'aa', 'Hal 1', 15000)", [id, `R${id}`]);
    }
    await voerQueryUit(database, "UPDATE Stand SET Isactief = 0 WHERE Id = 6");
    await voerQueryUit(database, "UPDATE Stand SET Status = 'Bezet' WHERE Id = 7");
    await voerQueryUit(database, "UPDATE Stand SET VerkoperId = 1 WHERE Id = 8");
  });
});
after(async () => {
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

test("beschikbare stands en actieve verkopers komen uit de geïsoleerde database", async () => {
  const antwoord = await GET();
  assert.equal(antwoord.status, 200);
  const gegevens = await antwoord.json();
  assert.deepEqual(gegevens.stands.map(stand => stand.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(gegevens.verkopers.map(verkoper => verkoper.id), [1, 2]);
  assert.deepEqual(gegevens.reserveringen, []);
  assert.equal(gegevens.stands[0].locatie, "Hal 1");
  assert.equal(gegevens.stands[0].prijsCenten, 15000);
});
test("verplichte keuzes en datums ontbreken: 400 met veldmeldingen", async () => {
  const antwoord = await verstuurReservering({});
  assert.equal(antwoord.status, 400);
  const { fouten } = await antwoord.json();
  for (const veld of ["standId", "verkoperId", "evenementdatum", "startdatum", "einddatum"]) assert.ok(fouten[veld]);
});
test("ongeldige JSON en ongeldige invoertypen worden geweigerd", async () => {
  assert.equal((await POST(new Request("http://localhost/api/stands/reserveringen", { method: "POST", body: "{" }))).status, 400);
  for (const wijziging of [{ standId: "1" }, { verkoperId: -1 }, { standId: [1] }, { opmerking: {} }, { opmerking: "a".repeat(2001) }]) {
    assert.equal((await verstuurReservering({ ...aanvraag, ...wijziging })).status, 400);
  }
});
test("onmogelijke datums en einddatum vóór startdatum worden geweigerd", async () => {
  for (const wijziging of [{ startdatum: "2026-02-30" }, { evenementdatum: "geen datum" }, { einddatum: "2026-10-31" }, { einddatum: "0000-01-01" }]) {
    assert.equal((await verstuurReservering({ ...aanvraag, ...wijziging })).status, 400);
  }
});
test("happy: koppelt de stand en bewaart status, datums en opmerkingen", async () => {
  const antwoord = await verstuurReservering();
  assert.equal(antwoord.status, 201);
  const resultaat = await antwoord.json();
  assert.deepEqual(resultaat, { id: 1, standId: 1, verkoperId: 1, status: "Gereserveerd" });
  await metDatabase(async database => {
    const [stand] = await haalRijenOp(database, "SELECT VerkoperId, Status, PrijsCenten, Datumgewijzigd FROM Stand WHERE Id = 1");
    assert.equal(stand.VerkoperId, 1);
    assert.equal(stand.Status, "Gereserveerd");
    assert.equal(stand.PrijsCenten, 15000);
    assert.ok(stand.Datumgewijzigd);
    const [reservering] = await haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 1");
    assert.equal(reservering.Startdatum, aanvraag.startdatum);
    assert.equal(reservering.Einddatum, aanvraag.einddatum);
    assert.equal(reservering.Evenementdatum, aanvraag.evenementdatum);
    assert.equal(reservering.Opmerking, aanvraag.opmerking);
  });
  const gegevens = await (await GET()).json();
  assert.ok(!gegevens.stands.some(stand => stand.id === 1));
  assert.equal(gegevens.reserveringen[0].verkoperNaam, "Verkoper 1");
});
test("al gereserveerd: 409, geen overschrijving, ook niet met andere datums", async () => {
  const antwoord = await verstuurReservering({ ...aanvraag, verkoperId: 2, startdatum: "2027-01-01", einddatum: "2027-01-02" });
  assert.equal(antwoord.status, 409);
  assert.equal((await antwoord.json()).error, "Deze stand is niet meer beschikbaar.");
  await metDatabase(async database => {
    assert.deepEqual(await haalRijenOp(database, "SELECT VerkoperId FROM Stand WHERE Id = 1"), [{ VerkoperId: 1 }]);
    assert.equal((await haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 1")).length, 1);
  });
});
test("onbekende of inactieve verkoper wordt geweigerd zonder standwijziging", async () => {
  for (const verkoperId of [999, 3]) assert.equal((await verstuurReservering({ ...aanvraag, standId: 2, verkoperId })).status, 400);
  await metDatabase(async database => assert.deepEqual(await haalRijenOp(database, "SELECT VerkoperId, Status FROM Stand WHERE Id = 2"), [{ VerkoperId: null, Status: "Beschikbaar" }]));
});
test("onbekende, inactieve, bezette of al gekoppelde stand is niet beschikbaar", async () => {
  for (const standId of [999, 6, 7, 8]) assert.equal((await verstuurReservering({ ...aanvraag, standId })).status, 409);
});
test("gelijktijdig reserveren: exact één succes en één conflict", async () => {
  const antwoorden = await Promise.all([verstuurReservering({ ...aanvraag, standId: 3 }), verstuurReservering({ ...aanvraag, standId: 3, verkoperId: 2 })]);
  assert.deepEqual(antwoorden.map(antwoord => antwoord.status).sort(), [201, 409]);
  const winnaar = await antwoorden.find(antwoord => antwoord.status === 201).json();
  await metDatabase(async database => {
    const [stand] = await haalRijenOp(database, "SELECT VerkoperId FROM Stand WHERE Id = 3");
    assert.equal(stand.VerkoperId, winnaar.verkoperId);
    assert.equal((await haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 3")).length, 1);
  });
});
test("fout tijdens opslaan draait koppeling en status terug", async () => {
  await metDatabase(database => voerQueryUit(database, "CREATE TRIGGER test_reservering_fout BEFORE INSERT ON StandReservering WHEN NEW.StandId = 4 BEGIN SELECT RAISE(ABORT, 'testfout'); END"));
  try {
    assert.equal((await verstuurReservering({ ...aanvraag, standId: 4 })).status, 500);
    await metDatabase(async database => {
      assert.deepEqual(await haalRijenOp(database, "SELECT Status, VerkoperId FROM Stand WHERE Id = 4"), [{ Status: "Beschikbaar", VerkoperId: null }]);
      assert.deepEqual(await haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 4"), []);
    });
  } finally { await metDatabase(database => voerQueryUit(database, "DROP TRIGGER test_reservering_fout")); }
});
test("unhappy: geforceerde databasefout geeft veilige Nederlandse 500-responses", async () => {
  process.env.FORCE_DB_ERROR = "1";
  try {
    const ophalen = await GET();
    assert.equal(ophalen.status, 500);
    assert.deepEqual(await ophalen.json(), { error: "De reserveringsgegevens konden niet worden geladen." });
    const opslaan = await verstuurReservering({ ...aanvraag, standId: 5 });
    assert.equal(opslaan.status, 500);
    assert.deepEqual(await opslaan.json(), { error: "De stand kon niet worden gereserveerd. Probeer opnieuw." });
  } finally { delete process.env.FORCE_DB_ERROR; }
  assert.equal((await GET()).status, 200);
});
test("databaseconstraints, foreign keys en integriteit blijven intact", async () => {
  await metDatabase(async database => {
    assert.deepEqual(await haalRijenOp(database, "PRAGMA integrity_check"), [{ integrity_check: "ok" }]);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA foreign_key_check"), []);
    await assert.rejects(voerQueryUit(database, "INSERT INTO StandReservering (StandId, Evenementdatum, Startdatum, Einddatum) VALUES (999, '2026-11-01', '2026-11-01', '2026-11-02')"), /FOREIGN KEY/);
    await assert.rejects(voerQueryUit(database, "INSERT INTO StandReservering (StandId, Evenementdatum, Startdatum, Einddatum) VALUES (5, '2026-11-01', '2026-11-02', '2026-11-01')"), /CHECK/);
  });
});
test("empty: een nieuwe tijdelijke database bevat geen development seeds", async () => {
  const oorspronkelijkPad = process.env.SQLITE_DATABASE_PATH;
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "leeg.sqlite3");
  try {
    const antwoord = await GET();
    assert.equal(antwoord.status, 200);
    assert.deepEqual(await antwoord.json(), { stands: [], verkopers: [], reserveringen: [] });
  } finally { process.env.SQLITE_DATABASE_PATH = oorspronkelijkPad; }
});
