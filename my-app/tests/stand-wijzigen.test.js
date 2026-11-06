import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { GET, PUT } from "../app/api/stands/[id]/route.js";
import { GET as haalStandsOp } from "../app/api/stands/route.js";
import { initialiseerDatabase, haalRijenOp, voerQueryUit, sluitDatabase } from "../lib/database/db.js";
import { reserveerStand, haalReserveringsgegevensOp } from "../lib/stand-reserveringen-database.js";
import { meldingStandWijzigenSucces, meldingStandWijzigenFout } from "../lib/stand-wijzigen-validatie.js";

let tijdelijkeMap;
const wijziging = { standnummer: "Gewijzigd-1", locatie: "Hal 2", grootte: 15.5, prijs: "175,25", verkoperId: null, verwachteVerkoperId: null };
const context = id => ({ params: Promise.resolve({ id: String(id) }) });
function verstuurWijziging(invoer = wijziging, id = 1) {
  return PUT(new Request(`http://localhost/api/stands/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoer) }), context(id));
}
async function metDatabase(actie) {
  const database = await initialiseerDatabase();
  try { return await actie(database); } finally { await sluitDatabase(database); }
}
async function leesStand(id) {
  return metDatabase(database => haalRijenOp(database, "SELECT * FROM Stand WHERE Id = ?", [id]));
}
before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "stand-wijzigen-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite3");
  await metDatabase(async database => {
    for (const [id, actief] of [[1, 1], [2, 1], [3, 0]]) await voerQueryUit(database, "INSERT INTO Verkoper (Id, Naam, VerkooptSoort, Dagen, Isactief) VALUES (?, ?, 'Sneakers', 2, ?)", [id, `Verkoper ${id}`, actief]);
    for (let id = 1; id <= 8; id++) await voerQueryUit(database, `
      INSERT INTO Stand (Id, Standnummer, Standtype, Locatie, Grootte, PrijsCenten, Opmerking, Datumaangemaakt, Datumgewijzigd)
      VALUES (?, ?, 'aa', 'Hal 1', 10, 10000, 'Bewaren', '2000-01-01', '2000-01-01')
    `, [id, `A0${id}`]);
    await voerQueryUit(database, "UPDATE Stand SET VerkoperId = 1, Status = 'Gereserveerd' WHERE Id = 2");
    await voerQueryUit(database, "UPDATE Stand SET Status = 'Bezet' WHERE Id = 4");
    await voerQueryUit(database, "UPDATE Stand SET VerkoperId = 3, Status = 'Gereserveerd' WHERE Id = 5");
    await voerQueryUit(database, "INSERT INTO StandReservering (StandId, Evenementdatum, Startdatum, Einddatum, Opmerking) VALUES (2, '2026-11-10', '2026-11-10', '2026-11-11', 'Reservering bewaren')");
  });
});
after(async () => {
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

test("formulierdata bevat stand en actieve verkopers, plus de huidige inactieve verkoper", async () => {
  const antwoord = await GET(new Request("http://localhost/api/stands/5"), context(5));
  assert.equal(antwoord.status, 200);
  const { stand, verkopers } = await antwoord.json();
  assert.equal(stand.verkoperId, 3);
  assert.equal(stand.grootte, 10);
  assert.equal(stand.prijsCenten, 10000);
  assert.deepEqual(verkopers.map(verkoper => verkoper.id), [1, 2, 3]);
  const andere = await GET(new Request("http://localhost/api/stands/1"), context(1));
  assert.deepEqual((await andere.json()).verkopers.map(verkoper => verkoper.id), [1, 2]);
});
test("ongeldige ids, JSON en ontbrekende velden worden geweigerd", async () => {
  for (const id of ["x", "0", "-1", "1.5", "1e2", "9007199254740992"]) {
    assert.equal((await GET(new Request("http://localhost/api/stands/x"), context(id))).status, 400);
    assert.equal((await verstuurWijziging(wijziging, id)).status, 400);
  }
  assert.equal((await PUT(new Request("http://localhost/api/stands/1", { method: "PUT", body: "{" }), context(1))).status, 400);
  const antwoord = await verstuurWijziging({});
  assert.equal(antwoord.status, 400);
  const { fouten } = await antwoord.json();
  for (const veld of ["standnummer", "locatie", "grootte", "verkoperId", "verwachteVerkoperId"]) assert.ok(fouten[veld]);
});
test("validatie weigert verkeerde typen, te lange waarden en ongeldige prijzen", async () => {
  const voor = await leesStand(1);
  for (const invoer of [null, [], { ...wijziging, standnummer: [] }, { ...wijziging, standnummer: "x".repeat(51) }, { ...wijziging, locatie: "x".repeat(151) }, { ...wijziging, grootte: 0 }, { ...wijziging, grootte: -1 }, { ...wijziging, grootte: "15" }, { ...wijziging, prijs: "-1" }, { ...wijziging, prijs: "1.234" }, { ...wijziging, prijs: true }, { ...wijziging, verkoperId: "1" }]) {
    assert.equal((await verstuurWijziging(invoer)).status, 400);
  }
  assert.deepEqual(await leesStand(1), voor);
});
test("happy: slaat standvelden op met exacte succesmelding en behoudt overige gegevens", async () => {
  const antwoord = await verstuurWijziging({ ...wijziging, standnummer: " Gewijzigd-1 " });
  assert.equal(antwoord.status, 200);
  assert.deepEqual(await antwoord.json(), { id: 1, verkoperId: null, status: "Beschikbaar", message: meldingStandWijzigenSucces });
  const [stand] = await leesStand(1);
  assert.equal(stand.Standnummer, wijziging.standnummer);
  assert.equal(stand.Locatie, wijziging.locatie);
  assert.equal(stand.Grootte, wijziging.grootte);
  assert.equal(stand.PrijsCenten, 17525);
  assert.equal(stand.Standtype, "aa");
  assert.equal(stand.Opmerking, "Bewaren");
  assert.equal(stand.Isactief, 1);
  assert.equal(stand.Datumaangemaakt, "2000-01-01");
  assert.notEqual(stand.Datumgewijzigd, "2000-01-01");
  const overzicht = await haalStandsOp(new Request("http://localhost/api/stands?zoek=Gewijzigd-1&type=aa"));
  assert.deepEqual(await overzicht.json(), [{ id: 1, standnummer: wijziging.standnummer, standtype: "aa" }]);
});
test("dubbel standnummer geeft 409 en bewaart de bestaande stand", async () => {
  const voor = await leesStand(1);
  const antwoord = await verstuurWijziging({ ...wijziging, standnummer: "A02" });
  assert.equal(antwoord.status, 409);
  assert.ok((await antwoord.json()).fouten.standnummer);
  assert.deepEqual(await leesStand(1), voor);
});
test("prijs mag leeg of nul zijn en wordt als nullable integer centen opgeslagen", async () => {
  for (const [prijs, verwacht] of [["", null], ["0", 0], ["10,50", 1050]]) {
    assert.equal((await verstuurWijziging({ ...wijziging, prijs })).status, 200);
    assert.equal((await leesStand(1))[0].PrijsCenten, verwacht);
  }
});
test("verkoper koppelen, wijzigen en loskoppelen houdt beschikbaarheid consistent", async () => {
  assert.equal((await verstuurWijziging({ ...wijziging, verkoperId: 1 })).status, 200);
  assert.equal((await leesStand(1))[0].Status, "Gereserveerd");
  assert.ok(!(await haalReserveringsgegevensOp()).stands.some(stand => stand.id === 1));
  assert.equal((await verstuurWijziging({ ...wijziging, verkoperId: 2, verwachteVerkoperId: 1 })).status, 200);
  assert.equal((await leesStand(1))[0].VerkoperId, 2);
  assert.equal((await verstuurWijziging({ ...wijziging, verwachteVerkoperId: 2 })).status, 200);
  assert.equal((await leesStand(1))[0].Status, "Beschikbaar");
  assert.ok((await haalReserveringsgegevensOp()).stands.some(stand => stand.id === 1));
});
test("onbekende en inactieve nieuwe verkopers worden geweigerd", async () => {
  const voor = await leesStand(1);
  for (const verkoperId of [3, 999]) assert.equal((await verstuurWijziging({ ...wijziging, verkoperId })).status, 400);
  assert.deepEqual(await leesStand(1), voor);
});
test("huidige inactieve verkoper kan behouden blijven bij aanpassen standgegevens", async () => {
  assert.equal((await verstuurWijziging({ ...wijziging, standnummer: "Gewijzigd-5", verkoperId: 3, verwachteVerkoperId: 3 }, 5)).status, 200);
  assert.equal((await leesStand(5))[0].VerkoperId, 3);
});
test("verkoper wijzigen behoudt bestaande reservering en datums", async () => {
  const voor = await metDatabase(database => haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 2"));
  assert.equal((await verstuurWijziging({ ...wijziging, standnummer: "Gewijzigd-2", verkoperId: 2, verwachteVerkoperId: 1 }, 2)).status, 200);
  assert.equal((await leesStand(2))[0].VerkoperId, 2);
  assert.equal((await leesStand(2))[0].Status, "Gereserveerd");
  assert.deepEqual(await metDatabase(database => haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 2")), voor);
});
test("lopende reservering kan niet ongemerkt worden geannuleerd via loskoppelen", async () => {
  const voor = await leesStand(2);
  assert.equal((await verstuurWijziging({ ...wijziging, standnummer: "Niet opslaan", verkoperId: null, verwachteVerkoperId: 2 }, 2)).status, 409);
  assert.deepEqual(await leesStand(2), voor);
});
test("bezette stand zonder verkoper krijgt niet zomaar een nieuwe koppeling", async () => {
  const voor = await leesStand(4);
  assert.equal((await verstuurWijziging({ ...wijziging, standnummer: "Niet opslaan", verkoperId: 1 }, 4)).status, 409);
  assert.deepEqual(await leesStand(4), voor);
});
test("niet-bestaande stand geeft 404 bij ophalen en opslaan", async () => {
  assert.equal((await GET(new Request("http://localhost/api/stands/999"), context(999))).status, 404);
  assert.equal((await verstuurWijziging(wijziging, 999)).status, 404);
});
test("unhappy: opslagfout bewaart geen gedeeltelijke wijzigingen", async () => {
  const voor = await leesStand(6);
  await metDatabase(database => voerQueryUit(database, "CREATE TRIGGER test_stand_wijzigen_fout AFTER UPDATE ON Stand WHEN OLD.Id = 6 BEGIN SELECT RAISE(ABORT, 'testfout'); END"));
  try {
    const antwoord = await verstuurWijziging({ ...wijziging, standnummer: "Niet opslaan", verkoperId: 1 }, 6);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingStandWijzigenFout });
    assert.deepEqual(await leesStand(6), voor);
  } finally { await metDatabase(database => voerQueryUit(database, "DROP TRIGGER test_stand_wijzigen_fout")); }
});
test("unhappy: databasefout geeft veilige foutmeldingen en herstel werkt", async () => {
  const voor = await leesStand(1);
  process.env.FORCE_DB_ERROR = "1";
  try {
    const ophalen = await GET(new Request("http://localhost/api/stands/1"), context(1));
    assert.equal(ophalen.status, 500);
    assert.deepEqual(await ophalen.json(), { error: "De standgegevens konden niet worden geladen." });
    const opslaan = await verstuurWijziging();
    assert.equal(opslaan.status, 500);
    assert.deepEqual(await opslaan.json(), { error: meldingStandWijzigenFout });
  } finally { delete process.env.FORCE_DB_ERROR; }
  assert.deepEqual(await leesStand(1), voor);
});
test("gelijktijdig verkoper wijzigen overschrijft de eerste koppeling niet", async () => {
  const antwoorden = await Promise.all([1, 2].map(verkoperId => verstuurWijziging({ ...wijziging, standnummer: "Gewijzigd-7", verkoperId }, 7)));
  assert.deepEqual(antwoorden.map(antwoord => antwoord.status).sort(), [200, 409]);
  const winnaar = await antwoorden.find(antwoord => antwoord.status === 200).json();
  assert.equal((await leesStand(7))[0].VerkoperId, winnaar.verkoperId);
});
test("gelijktijdig reserveren en wijzigen laat de reservering en verkoper intact", async () => {
  const [wijzigen, reservering] = await Promise.all([
    verstuurWijziging({ ...wijziging, standnummer: "Gewijzigd-8" }, 8),
    reserveerStand({ standId: 8, verkoperId: 1, evenementdatum: "2026-11-10", startdatum: "2026-11-10", einddatum: "2026-11-11", opmerking: "Bewaren" }),
  ]);
  assert.ok([200, 409].includes(wijzigen.status));
  assert.equal(reservering.verkoperId, 1);
  assert.equal((await leesStand(8))[0].VerkoperId, 1);
  assert.equal((await leesStand(8))[0].Status, "Gereserveerd");
  assert.equal((await metDatabase(database => haalRijenOp(database, "SELECT * FROM StandReservering WHERE StandId = 8"))).length, 1);
});
test("database blijft geïsoleerd en integer en SQL-achtige tekst blijft data", async () => {
  const standnummer = "Stand'); DROP TABLE Stand; --";
  assert.equal((await verstuurWijziging({ ...wijziging, standnummer })).status, 200);
  assert.equal((await leesStand(1))[0].Standnummer, standnummer);
  await metDatabase(async database => {
    assert.equal((await haalRijenOp(database, "SELECT COUNT(*) AS aantal FROM Stand"))[0].aantal, 8);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA integrity_check"), [{ integrity_check: "ok" }]);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA foreign_key_check"), []);
    assert.ok((await haalRijenOp(database, "PRAGMA database_list"))[0].file.startsWith(tijdelijkeMap));
  });
});
