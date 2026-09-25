import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const standaardDatabasePad = path.join(
  process.cwd(),
  "lib",
  "database",
  "sneakerness.sqlite3",
);
const databaseSeedPad = path.join(process.cwd(), "seed.sql");

export function openDatabase(databasePad) {
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

function voerDatabaseSqlUit(database, sql) {
  return new Promise((resolve, reject) => {
    database.exec(sql, (fout) => {
      if (fout) {
        reject(fout);
        return;
      }

      resolve();
    });
  });
}

async function schakelForeignKeysIn(database) {
  await voerDatabaseSqlUit(database, "PRAGMA foreign_keys = ON;");
}

async function initialiseerVerkoperTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS Verkoper (
        Id INTEGER PRIMARY KEY AUTOINCREMENT
        ,Naam TEXT NOT NULL
        ,SpecialeStatus INTEGER NOT NULL DEFAULT 0
            CHECK (SpecialeStatus IN (0, 1))
        ,VerkooptSoort TEXT NOT NULL
        ,Dagen INTEGER NOT NULL
            CHECK (Dagen IN (1, 2))
        ,Logo TEXT
        ,Isactief INTEGER NOT NULL DEFAULT 1
            CHECK (Isactief IN (0, 1))
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initialiseerStandTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS Stand (
        Id INTEGER PRIMARY KEY AUTOINCREMENT
        ,Standnummer TEXT NOT NULL UNIQUE
        ,Standtype TEXT NOT NULL
            CHECK (Standtype IN ('aa-plus', 'aa', 'a', 'side-stand'))
        ,Isactief INTEGER NOT NULL DEFAULT 1
            CHECK (Isactief IN (0, 1))
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function moetVoorbeelddataToevoegen() {
  return process.env.NODE_ENV !== "production"
    && !process.env.SQLITE_DATABASE_PATH
    && !process.env.STANDS_DATABASE_PATH;
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
  const databasePad = process.env.SQLITE_DATABASE_PATH
    ?? process.env.STANDS_DATABASE_PATH
    ?? standaardDatabasePad;
  await mkdir(path.dirname(databasePad), { recursive: true });

  const database = await openDatabase(databasePad);

  try {
    // Schakelt foreign keys in voor iedere verbinding.
    await schakelForeignKeysIn(database);
    await initialiseerVerkoperTabel(database);
    await initialiseerStandTabel(database);

    if (moetVoorbeelddataToevoegen()) {
      const databaseSeed = await readFile(databaseSeedPad, "utf8");
      await voerDatabaseSqlUit(database, databaseSeed);
    }

    return database;
  } catch (fout) {
    await sluitDatabase(database);
    throw fout;
  }
}
