import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
  voerQueryUit,
} from "../lib/database/db.js";
import { voegDemoDataToe } from "../lib/database/demo-data.js";

let tijdelijkeMap;
let database;

// Eén gedeelde database per testbestand. De demo-data is idempotent, dus de
// tests mogen elkaars seed-uitvoering herhalen zonder extra rijen op te bouwen.
before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "demo-data-"));
  process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite");
  database = await initialiseerDatabase();
});

after(async () => {
  await sluitDatabase(database);
  delete process.env.SQLITE_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

function haalOp(sql, parameters = []) {
  return haalRijenOp(database, sql, parameters);
}

test("seedt demo-standen", async () => {
  await voegDemoDataToe(database);

  assert.deepEqual(
    await haalOp("SELECT Standnummer, Standtype FROM Stand ORDER BY Standnummer"),
    [
      { Standnummer: "A01", Standtype: "aa-plus" },
      { Standnummer: "A02", Standtype: "aa" },
      { Standnummer: "A03", Standtype: "a" },
      { Standnummer: "B01", Standtype: "aa-plus" },
      { Standnummer: "B02", Standtype: "aa" },
      { Standnummer: "S01", Standtype: "side-stand" },
    ],
  );
});

test("seedt demo-verkopers", async () => {
  await voegDemoDataToe(database);

  assert.deepEqual(
    await haalOp(
      "SELECT Naam, SpecialeStatus, VerkooptSoort, Dagen FROM Verkoper ORDER BY Naam",
    ),
    [
      { Naam: "Bite & Sip", SpecialeStatus: 0, VerkooptSoort: "Eten en Drinken", Dagen: 2 },
      { Naam: "Lace Lab", SpecialeStatus: 1, VerkooptSoort: "Accessoires", Dagen: 1 },
      { Naam: "Mini Kicks", SpecialeStatus: 1, VerkooptSoort: "Kids Corner", Dagen: 1 },
      { Naam: "Sneaker District", SpecialeStatus: 1, VerkooptSoort: "Sneakers", Dagen: 2 },
      { Naam: "Sole Society", SpecialeStatus: 0, VerkooptSoort: "Sneakers", Dagen: 1 },
      { Naam: "Urban Threads", SpecialeStatus: 0, VerkooptSoort: "Streetwear", Dagen: 2 },
    ],
  );
});

test("seedt demo-contactpersonen", async () => {
  await voegDemoDataToe(database);

  assert.deepEqual(
    await haalOp("SELECT id, Naam, Email FROM contactpersonen ORDER BY id"),
    [
      { id: 1, Naam: "Daan de Vries", Email: "daan.devries@example.com" },
      { id: 2, Naam: "Lisa Jansen", Email: "lisa.jansen@example.com" },
    ],
  );
});

test("demo-data is idempotent bij herhaald toevoegen", async () => {
  await voegDemoDataToe(database);
  await voegDemoDataToe(database);

  const aantallen = {};

  for (const tafel of ["Stand", "Verkoper", "contactpersonen"]) {
    const [{ aantal }] = await haalOp(`SELECT COUNT(*) AS aantal FROM ${tafel}`);
    aantallen[tafel] = aantal;
  }

  assert.deepEqual(aantallen, {
    Stand: 6,
    Verkoper: 6,
    contactpersonen: 2,
  });
});

test("raakt een bestaande verkopersnaam niet aan", async () => {
  const databasePad = path.join(tijdelijkeMap, "bestaande-verkoper.sqlite");
  process.env.SQLITE_DATABASE_PATH = databasePad;
  const eigenDatabase = await initialiseerDatabase();

  try {
    await voerQueryUit(
      eigenDatabase,
      `INSERT INTO Verkoper (Naam, VerkooptSoort, Dagen)
       VALUES (?, ?, ?)`,
      ["Sneaker District", "Sneakers", 1],
    );

    await voegDemoDataToe(eigenDatabase);

    const verkopers = await haalRijenOp(
      eigenDatabase,
      "SELECT Dagen FROM Verkoper WHERE Naam = ?",
      ["Sneaker District"],
    );

    assert.deepEqual(verkopers, [{ Dagen: 1 }]);
  } finally {
    await sluitDatabase(eigenDatabase);
    process.env.SQLITE_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite");
    await rm(databasePad, { force: true });
  }
});