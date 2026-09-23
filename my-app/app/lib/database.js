import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const standaardDatabasePad = path.join(
  process.cwd(),
  "data",
  "sneakerness.sqlite",
);
const databaseSchemaPad = path.join(process.cwd(), "database.sql");
const databaseSeedPad = path.join(process.cwd(), "seed.sql");

function openDatabase(databasePad) {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(databasePad, (fout) => {
      if (fout) {
        reject(fout);
        return;
      }

      resolve(database);
    });
  });
}

function voerDatabaseSchemaUit(database, schema) {
  return new Promise((resolve, reject) => {
    database.exec(schema, (fout) => {
      if (fout) {
        reject(fout);
        return;
      }

      resolve();
    });
  });
}

export function voerQueryUit(database, sql, parameters = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, parameters, function queryResultaat(fout) {
      if (fout) {
        reject(fout);
        return;
      }

      resolve({ id: this.lastID, wijzigingen: this.changes });
    });
  });
}

export function haalRijenOp(database, sql, parameters = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, parameters, (fout, rijen) => {
      if (fout) {
        reject(fout);
        return;
      }

      resolve(rijen);
    });
  });
}

async function bestaatTabel(database, tabelnaam) {
  const tabellen = await haalRijenOp(
    database,
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table' AND name = ?`,
    [tabelnaam],
  );

  return tabellen.length > 0;
}

async function telRijen(database, tabelnaam) {
  const [resultaat] = await haalRijenOp(
    database,
    `SELECT COUNT(*) AS aantal FROM "${tabelnaam}"`,
  );

  return resultaat.aantal;
}

async function gebruiktDefinitiefVerkoperSchema(database) {
  if (!await bestaatTabel(database, "Verkoper")) {
    return false;
  }

  const kolommen = await haalRijenOp(database, "PRAGMA table_info('Verkoper')");
  const kolomnamen = new Set(kolommen.map((kolom) => kolom.name));

  return ["Naam", "SpecialeStatus", "VerkooptSoort", "Dagen", "Logo"]
    .every((kolomnaam) => kolomnamen.has(kolomnaam));
}

async function bereidVerkoperSchemaVoor(database) {
  if (await gebruiktDefinitiefVerkoperSchema(database)) {
    return;
  }

  if (await bestaatTabel(database, "Verkoper")) {
    const aantalVerkopers = await telRijen(database, "Verkoper");

    if (aantalVerkopers > 0) {
      throw new Error(
        "Bestaande Verkoper-data kan niet automatisch naar het nieuwe model worden vertaald.",
      );
    }

    if (await bestaatTabel(database, "VerkoperLegacy")) {
      throw new Error("VerkoperLegacy bestaat al; automatische schemawijziging gestopt.");
    }

    // Bewaart het lege oude schema zonder gegevens te verwijderen.
    await voerQueryUit(database, "ALTER TABLE Verkoper RENAME TO VerkoperLegacy");
  }

  if (await bestaatTabel(database, "verkopers")) {
    const aantalLegacyVerkopers = await telRijen(database, "verkopers");

    if (aantalLegacyVerkopers > 0) {
      throw new Error(
        "Legacy verkopers kunnen niet automatisch naar het nieuwe model worden vertaald.",
      );
    }
  }
}

function moetVoorbeelddataToevoegen() {
  return process.env.NODE_ENV !== "production"
    && !process.env.SQLITE_DATABASE_PATH;
}

export function sluitDatabase(database) {
  return new Promise((resolve, reject) => {
    database.close((fout) => {
      if (fout) {
        reject(fout);
        return;
      }

      resolve();
    });
  });
}

export async function initialiseerDatabase() {
  const databasePad = process.env.SQLITE_DATABASE_PATH ?? standaardDatabasePad;
  await mkdir(path.dirname(databasePad), { recursive: true });

  const database = await openDatabase(databasePad);

  try {
    await voerQueryUit(database, "BEGIN IMMEDIATE TRANSACTION");
    await bereidVerkoperSchemaVoor(database);

    const databaseSchema = await readFile(databaseSchemaPad, "utf8");

    // Voert het centrale databaseschema uit.
    await voerDatabaseSchemaUit(database, databaseSchema);

    if (moetVoorbeelddataToevoegen()) {
      const databaseSeed = await readFile(databaseSeedPad, "utf8");
      await voerDatabaseSchemaUit(database, databaseSeed);
    }

    await voerQueryUit(database, "COMMIT");

    return database;
  } catch (fout) {
    try {
      await voerQueryUit(database, "ROLLBACK");
    } catch {
      // Er is niets terug te draaien als de transactie niet gestart kon worden.
    }

    await sluitDatabase(database);
    throw fout;
  }
}
