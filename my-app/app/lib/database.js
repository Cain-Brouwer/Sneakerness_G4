import { mkdir } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const standaardDatabasePad = path.join(
  process.cwd(),
  "data",
  "sneakerness.sqlite",
);

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

  await voerQueryUit(
    database,
    `CREATE TABLE IF NOT EXISTS verkopers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bedrijfsnaam TEXT NOT NULL,
      contactpersoon TEXT NOT NULL,
      email TEXT NOT NULL,
      telefoon TEXT NOT NULL,
      type_verkoper TEXT NOT NULL CHECK (
        type_verkoper IN ('sneakersverkoper', 'side-stand')
      )
    )`,
  );

  return database;
}
