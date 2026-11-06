import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { GET, PUT } from "../app/api/verkopers/[id]/route.js";
import { initialiseerDatabase, haalRijenOp, voerQueryUit, sluitDatabase } from "../lib/database/db.js";
import { meldingWijzigenSucces, meldingWijzigenFout } from "../lib/verkoper-wijzigen-validatie.js";

let tijdelijkeMap;
const wijziging = { naam: "Nieuwe bedrijfsnaam", contactpersoon: "Sam Nieuw", email: "sam@example.nl", telefoon: "0612345678", adres: "Nieuwe straat 10", contactpersoonId: 1 };
const context = id => ({ params: Promise.resolve({ id: String(id) }) });
function verstuurWijziging(invoer = wijziging, id = 1) {
  return PUT(new Request(`http://localhost/api/verkopers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoer) }), context(id));
}
async function metDatabase(actie) {
  const database = await initialiseerDatabase();
  try { return await actie(database); } finally { await sluitDatabase(database); }
}
async function leesDetail(id) {
  const antwoord = await GET(new Request(`http://localhost/api/verkopers/${id}`), context(id));
  assert.equal(antwoord.status, 200);
  return antwoord.json();
}
before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "verkoper-wijzigen-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite3");
  await metDatabase(async database => {
    for (let id = 1; id <= 5; id++) {
      await voerQueryUit(database, `INSERT INTO Verkoper (Id, Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo, Adres, Postcode, Plaats, Opmerking, Datumaangemaakt, Datumgewijzigd)
        VALUES (?, ?, 1, 'Sneakers', 2, '/logo.svg', 'Oude straat 1', '1234 AB', 'Rotterdam', 'Bewaren', '2000-01-01', '2000-01-01')`, [id, `Bedrijf ${id}`]);
    }
    for (let id = 1; id <= 4; id++) await voerQueryUit(database, "INSERT INTO contactpersonen (id, Naam, Email, Telefoonnummer, IsActief) VALUES (?, ?, ?, '0600000000', 1)", [id, `Contact ${id}`, `contact${id}@example.nl`]);
    await voerQueryUit(database, "INSERT INTO verkoper_contactpersoon (VerkoperId, ContactpersoonId) VALUES (1, 1), (1, 3), (4, 1), (5, 4)");
    await voerQueryUit(database, "INSERT INTO Contactpersoonverkoper (VerkoperId, ContactpersoonId) VALUES (1, 1), (2, 2)");
    await voerQueryUit(database, "INSERT INTO Stand (Standnummer, Standtype, VerkoperId, Status) VALUES ('A01', 'aa', 1, 'Gereserveerd')");
  });
});
after(async () => {
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

test("formulierdata ondersteunt oude en nieuwe koppelingen, zonder dubbele contactpersonen", async () => {
  const verkoper = await leesDetail(1);
  assert.equal(verkoper.naam, "Bedrijf 1");
  assert.equal(verkoper.adres, "Oude straat 1");
  assert.deepEqual(verkoper.contactpersonen.map(contact => contact.id), [1, 3]);
  assert.equal((await leesDetail(2)).contactpersonen[0].id, 2);
  assert.deepEqual((await leesDetail(3)).contactpersonen, []);
});
test("ontbrekende velden geven 400 en veranderen niets", async () => {
  const voor = await leesDetail(1);
  const antwoord = await verstuurWijziging({});
  assert.equal(antwoord.status, 400);
  const { fouten } = await antwoord.json();
  for (const veld of ["naam", "contactpersoon", "email", "adres"]) assert.ok(fouten[veld]);
  assert.deepEqual(await leesDetail(1), voor);
});
test("ongeldige JSON en ongeldige ids geven 400", async () => {
  const request = new Request("http://localhost/api/verkopers/1", { method: "PUT", body: "{" });
  assert.equal((await PUT(request, context(1))).status, 400);
  for (const id of ["x", "0", "-1", "1.5", "1e2", "9007199254740992"]) assert.equal((await verstuurWijziging(wijziging, id)).status, 400);
});
test("validatie weigert ongeldige waarden, te lange tekst en verkeerd e-mailadres", async () => {
  for (const gegevens of [null, [], { ...wijziging, naam: [] }, { ...wijziging, email: "fout" }, { ...wijziging, contactpersoonId: "1" }, { ...wijziging, naam: "x".repeat(151) }, { ...wijziging, adres: "x".repeat(201) }, { ...wijziging, telefoon: "x".repeat(31) }]) {
    assert.equal((await verstuurWijziging(gegevens)).status, 400);
  }
});
test("happy: wijzigingen worden opgeslagen met de exacte succesmelding", async () => {
  const antwoord = await verstuurWijziging({ ...wijziging, naam: " Nieuwe bedrijfsnaam " });
  assert.equal(antwoord.status, 200);
  assert.deepEqual(await antwoord.json(), { id: 1, contactpersoonId: 1, message: meldingWijzigenSucces });
  const verkoper = await leesDetail(1);
  assert.equal(verkoper.naam, wijziging.naam);
  assert.equal(verkoper.adres, wijziging.adres);
  assert.deepEqual(verkoper.contactpersonen.find(contact => contact.id === 1), { id: 1, naam: wijziging.contactpersoon, email: wijziging.email, telefoon: wijziging.telefoon });
  // Niet-bewerkbare verkopervelden en standkoppelingen blijven intact.
  await metDatabase(async database => {
    const [verkoperRij] = await haalRijenOp(database, "SELECT * FROM Verkoper WHERE Id = 1");
    assert.equal(verkoperRij.SpecialeStatus, 1);
    assert.equal(verkoperRij.VerkooptSoort, "Sneakers");
    assert.equal(verkoperRij.Dagen, 2);
    assert.equal(verkoperRij.Logo, "/logo.svg");
    assert.equal(verkoperRij.Opmerking, "Bewaren");
    assert.equal(verkoperRij.Postcode, "1234 AB");
    assert.equal(verkoperRij.Plaats, "Rotterdam");
    assert.equal(verkoperRij.Datumaangemaakt, "2000-01-01");
    assert.notEqual(verkoperRij.Datumgewijzigd, "2000-01-01");
    assert.deepEqual(await haalRijenOp(database, "SELECT VerkoperId, Status FROM Stand"), [{ VerkoperId: 1, Status: "Gereserveerd" }]);
  });
});
test("alleen de gekozen contactpersoon wijzigt; gedeelde gegevens blijven centraal", async () => {
  assert.equal((await leesDetail(1)).contactpersonen.find(contact => contact.id === 3).naam, "Contact 3");
  assert.equal((await leesDetail(4)).contactpersonen[0].naam, wijziging.contactpersoon);
  assert.equal((await leesDetail(4)).naam, "Bedrijf 4");
});
test("oudere contactpersoonkoppeling blijft wijzigbaar en optionele telefoon mag leeg", async () => {
  const antwoord = await verstuurWijziging({ ...wijziging, contactpersoonId: 2, telefoon: "" }, 2);
  assert.equal(antwoord.status, 200);
  assert.equal((await leesDetail(2)).contactpersonen[0].telefoon, null);
});
test("verkoper zonder contactpersoon krijgt één nieuwe gekoppelde contactpersoon", async () => {
  const antwoord = await verstuurWijziging({ ...wijziging, contactpersoonId: null }, 3);
  assert.equal(antwoord.status, 200);
  const resultaat = await antwoord.json();
  assert.ok(resultaat.contactpersoonId > 4);
  assert.equal((await leesDetail(3)).contactpersonen.length, 1);
  assert.equal((await verstuurWijziging({ ...wijziging, contactpersoonId: resultaat.contactpersoonId }, 3)).status, 200);
  assert.equal((await leesDetail(3)).contactpersonen.length, 1);
});
test("niet-bestaande verkoper geeft 404", async () => {
  assert.equal((await verstuurWijziging(wijziging, 999)).status, 404);
});
test("vreemde of ontbrekende contactpersoonselectie geeft 409 zonder wijzigingen", async () => {
  const voor = await leesDetail(1);
  for (const contactpersoonId of [2, null, 999]) assert.equal((await verstuurWijziging({ ...wijziging, naam: "Niet opslaan", contactpersoonId })).status, 409);
  assert.deepEqual(await leesDetail(1), voor);
});
test("fout bij contactpersoon opslaan draait ook bedrijfswijzigingen terug", async () => {
  const voor = await leesDetail(5);
  await metDatabase(database => voerQueryUit(database, "CREATE TRIGGER test_wijziging_fout BEFORE UPDATE ON contactpersonen WHEN OLD.id = 4 BEGIN SELECT RAISE(ABORT, 'testfout'); END"));
  try {
    const antwoord = await verstuurWijziging({ ...wijziging, contactpersoonId: 4, naam: "Niet opslaan" }, 5);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingWijzigenFout });
    assert.deepEqual(await leesDetail(5), voor);
  } finally { await metDatabase(database => voerQueryUit(database, "DROP TRIGGER test_wijziging_fout")); }
});
test("unhappy: databasefout geeft de exacte foutmelding en bewaart geen wijzigingen", async () => {
  const voor = await leesDetail(1);
  process.env.FORCE_DB_ERROR = "1";
  try {
    const antwoord = await verstuurWijziging({ ...wijziging, naam: "Niet opslaan" });
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: meldingWijzigenFout });
  } finally { delete process.env.FORCE_DB_ERROR; }
  assert.deepEqual(await leesDetail(1), voor);
});
test("SQL-achtige tekst blijft data en de testdatabase blijft geïsoleerd en integer", async () => {
  const naam = "Sneakers'); DROP TABLE Verkoper; --";
  assert.equal((await verstuurWijziging({ ...wijziging, naam })).status, 200);
  assert.equal((await leesDetail(1)).naam, naam);
  await metDatabase(async database => {
    assert.equal((await haalRijenOp(database, "SELECT COUNT(*) AS aantal FROM Verkoper"))[0].aantal, 5);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA integrity_check"), [{ integrity_check: "ok" }]);
    assert.deepEqual(await haalRijenOp(database, "PRAGMA foreign_key_check"), []);
    assert.ok((await haalRijenOp(database, "PRAGMA database_list"))[0].file.startsWith(tijdelijkeMap));
  });
});
