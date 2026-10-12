import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { initialiseerAlleTabellen } from "./schema.js";

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

function moetVoorbeelddataToevoegen() {
  return process.env.NODE_ENV !== "production"
    && !process.env.SQLITE_DATABASE_PATH
    && !process.env.STANDS_DATABASE_PATH;
}

export async function initialiseerDatabase() {
  if (process.env.FORCE_DB_ERROR === "1") {
    throw new Error("Geen verbinding met de database");
  }

  const databasePad = process.env.SQLITE_DATABASE_PATH
    ?? process.env.STANDS_DATABASE_PATH
    ?? standaardDatabasePad;
  await mkdir(path.dirname(databasePad), { recursive: true });

  const database = await openDatabase(databasePad);

  try {
    await initialiseerAlleTabellen(database);

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

export async function checkDatabaseConnection() {
  // Gooit een Error als er geen databaseverbinding is (bijv. FORCE_DB_ERROR=1).
  const database = await initialiseerDatabase();
  await sluitDatabase(database);
}
