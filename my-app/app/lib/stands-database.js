import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const standaardStandsDatabasePad = path.join(
  process.cwd(),
  "data",
  "sneakerness.sqlite",
);
const databaseSchemaPad = path.join(process.cwd(), "database.sql");

function openDatabaseVoorStands(databasePad) {
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

export function voerStandQueryUit(database, sql, parameters = []) {
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

export function haalStandRijenOp(database, sql, parameters = []) {
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

async function bestaatLegacyStandtabel(database) {
  const tabellen = await haalStandRijenOp(
    database,
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table' AND name = 'stands'`,
  );

  return tabellen.length > 0;
}

async function controleerLegacyStanddata(database) {
  if (!await bestaatLegacyStandtabel(database)) {
    return false;
  }

  const dubbeleStandnummers = await haalStandRijenOp(
    database,
    `SELECT standnummer
     FROM stands
     GROUP BY standnummer
     HAVING COUNT(*) > 1`,
  );

  if (dubbeleStandnummers.length > 0) {
    throw new Error("Legacy stands bevatten dubbele standnummers.");
  }

  return true;
}

async function migreerLegacyStands(database) {
  await voerStandQueryUit(database, "BEGIN IMMEDIATE TRANSACTION");

  try {
    const conflicten = await haalStandRijenOp(
      database,
      `SELECT legacy.id, legacy.standnummer
       FROM stands AS legacy
       INNER JOIN Stand AS nieuw
         ON nieuw.Id = legacy.id OR nieuw.Standnummer = legacy.standnummer
       WHERE nieuw.Id != legacy.id
          OR nieuw.Standnummer != legacy.standnummer
          OR nieuw.Standtype != legacy.standtype`,
    );

    if (conflicten.length > 0) {
      throw new Error("Legacy stands conflicteren met bestaande Stand-data.");
    }

    await voerStandQueryUit(
      database,
      `INSERT INTO Stand (Id, Standnummer, Standtype)
       SELECT legacy.id, legacy.standnummer, legacy.standtype
       FROM stands AS legacy
       WHERE NOT EXISTS (
         SELECT 1
         FROM Stand AS nieuw
         WHERE nieuw.Id = legacy.id
            OR nieuw.Standnummer = legacy.standnummer
       )`,
    );

    const ontbrekendeStands = await haalStandRijenOp(
      database,
      `SELECT legacy.id
       FROM stands AS legacy
       LEFT JOIN Stand AS nieuw
         ON nieuw.Id = legacy.id
        AND nieuw.Standnummer = legacy.standnummer
        AND nieuw.Standtype = legacy.standtype
       WHERE nieuw.Id IS NULL`,
    );

    if (ontbrekendeStands.length > 0) {
      throw new Error("Niet alle legacy stands konden veilig worden gemigreerd.");
    }

    await voerStandQueryUit(database, "COMMIT");
  } catch (fout) {
    await voerStandQueryUit(database, "ROLLBACK");
    throw fout;
  }
}

export function sluitStandsDatabase(database) {
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

export async function initialiseerStandsDatabase() {
  const databasePad = process.env.STANDS_DATABASE_PATH
    ?? standaardStandsDatabasePad;

  await mkdir(path.dirname(databasePad), { recursive: true });

  const database = await openDatabaseVoorStands(databasePad);

  try {
    const heeftLegacyStandtabel = await controleerLegacyStanddata(database);
    const databaseSchema = await readFile(databaseSchemaPad, "utf8");

    // Voert het centrale databaseschema uit.
    await voerDatabaseSchemaUit(database, databaseSchema);

    if (heeftLegacyStandtabel) {
      await migreerLegacyStands(database);
    }

    return database;
  } catch (fout) {
    await sluitStandsDatabase(database);
    throw fout;
  }
}
