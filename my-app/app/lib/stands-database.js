import { mkdir } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const standaardStandsDatabasePad = path.join(
  process.cwd(),
  "data",
  "sneakerness.sqlite",
);

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

  await voerStandQueryUit(
    database,
    `CREATE TABLE IF NOT EXISTS stands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      standnummer TEXT NOT NULL,
      standtype TEXT NOT NULL CHECK (
        standtype IN ('aa-plus', 'aa', 'a', 'side-stand')
      )
    )`,
  );

  return database;
}
