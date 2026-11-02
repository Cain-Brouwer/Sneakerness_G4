import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { GET, POST } from "../app/api/stands/route.js";
import { initialiseerDatabase, haalRijenOp, sluitDatabase } from "../lib/database/db.js";

let tijdelijkeMap;
const voorbeeldStand = { standnummer: "C01", standtype: "aa", locatie: "Hal 1", grootte: 12.5, prijs: "150,25", status: "Beschikbaar", opmerking: "Bij de ingang" };

before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "stand-toevoegen-"));
  process.env.STANDS_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite");
});
after(async () => {
  delete process.env.STANDS_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});
function verstuurStand(invoer) {
  return POST(new Request("http://localhost/api/stands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invoer) }));
}

test("ontbrekende verplichte gegevens geven veldmeldingen en 400", async () => {
  const antwoord = await verstuurStand({});
  assert.equal(antwoord.status, 400);
  const { fouten } = await antwoord.json();
  for (const veld of ["standnummer", "standtype", "locatie", "grootte", "status"]) assert.ok(fouten[veld]);
});
test("ongeldige JSON geeft 400", async () => {
  const antwoord = await POST(new Request("http://localhost/api/stands", { method: "POST", body: "{" }));
  assert.equal(antwoord.status, 400);
});
test("ongeldig type, grootte en prijs worden geweigerd", async () => {
  for (const invoer of [
    { ...voorbeeldStand, standtype: "restaurant" },
    { ...voorbeeldStand, standtype: ["aa"] },
    { ...voorbeeldStand, grootte: 0 },
    { ...voorbeeldStand, grootte: -1 },
    { ...voorbeeldStand, prijs: "-5" },
    { ...voorbeeldStand, prijs: "1.234" },
  ]) assert.equal((await verstuurStand(invoer)).status, 400);
});
test("happy: slaat alle standgegevens op en toont de stand in het overzicht", async () => {
  const antwoord = await verstuurStand(voorbeeldStand);
  assert.equal(antwoord.status, 201);
  const { id } = await antwoord.json();
  const overzicht = await GET(new Request("http://localhost/api/stands?zoek=C01&type=aa"));
  assert.deepEqual(await overzicht.json(), [{ id, standnummer: "C01", standtype: "aa" }]);
  const database = await initialiseerDatabase();
  try {
    const [stand] = await haalRijenOp(database, "SELECT * FROM Stand WHERE Id = ?", [id]);
    assert.equal(stand.Locatie, "Hal 1");
    assert.equal(stand.Grootte, 12.5);
    assert.equal(stand.PrijsCenten, 15025);
    assert.equal(stand.Status, "Beschikbaar");
    assert.equal(stand.Opmerking, "Bij de ingang");
    assert.equal(stand.VerkoperId, null);
    assert.equal(stand.Isactief, 1);
  } finally { await sluitDatabase(database); }
});
test("dubbel standnummer geeft 409 en overschrijft geen gegevens", async () => {
  const antwoord = await verstuurStand({ ...voorbeeldStand, grootte: 99 });
  assert.equal(antwoord.status, 409);
  assert.ok((await antwoord.json()).fouten.standnummer);
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(database, "SELECT Grootte FROM Stand WHERE Standnummer = ?", [voorbeeldStand.standnummer]);
    assert.deepEqual(rijen, [{ Grootte: 12.5 }]);
  } finally { await sluitDatabase(database); }
});
for (const standtype of ["aa-plus", "aa", "a", "side-stand"]) {
  test(`accepteert standtype ${standtype}, optionele prijs en opmerkingen`, async () => {
    const antwoord = await verstuurStand({ ...voorbeeldStand, standnummer: `Test-${standtype}`, standtype, prijs: "", opmerking: "" });
    assert.equal(antwoord.status, 201);
    const { id } = await antwoord.json();
    const database = await initialiseerDatabase();
    try {
      const [stand] = await haalRijenOp(database, "SELECT PrijsCenten, Opmerking FROM Stand WHERE Id = ?", [id]);
      assert.equal(stand.PrijsCenten, null);
      assert.equal(stand.Opmerking, null);
    } finally { await sluitDatabase(database); }
  });
}
test("databasefout geeft een Nederlandse 500-response zonder technische details", async () => {
  process.env.FORCE_DB_ERROR = "1";
  try {
    const antwoord = await verstuurStand(voorbeeldStand);
    assert.equal(antwoord.status, 500);
    assert.deepEqual(await antwoord.json(), { error: "De stand kon niet worden toegevoegd. Probeer opnieuw." });
  } finally { delete process.env.FORCE_DB_ERROR; }
});
test("empty: niet-bestaande zoekterm blijft 200 met een lege lijst", async () => {
  const antwoord = await GET(new Request("http://localhost/api/stands?zoek=bestaatniet"));
  assert.equal(antwoord.status, 200);
  assert.deepEqual(await antwoord.json(), []);
});
test("gelijktijdige initialisatie behoudt iedere standkolom eenmaal", async () => {
  const oorspronkelijkPad = process.env.STANDS_DATABASE_PATH;
  process.env.STANDS_DATABASE_PATH = path.join(tijdelijkeMap, "parallel.sqlite");
  try {
    const resultaten = await Promise.allSettled(Array.from({ length: 6 }, async () => {
      const database = await initialiseerDatabase();
      try {
        const kolommen = await haalRijenOp(database, "PRAGMA table_info(Stand)");
        for (const naam of ["Locatie", "Grootte", "PrijsCenten", "Status", "VerkoperId"]) assert.equal(kolommen.filter(k => k.name === naam).length, 1);
      } finally { await sluitDatabase(database); }
    }));
    for (const resultaat of resultaten) assert.equal(resultaat.status, "fulfilled", resultaat.reason?.message);
  } finally { process.env.STANDS_DATABASE_PATH = oorspronkelijkPad; }
});
