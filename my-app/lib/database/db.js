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

export async function initialiseerVoorbeelddata(database) {
  await voerDatabaseSqlUit(database, `CREATE TABLE IF NOT EXISTS OntwikkelSeed (
    Naam TEXT PRIMARY KEY,
    Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [bestaandeSeed] = await haalRijenOp(database, "SELECT Naam FROM OntwikkelSeed WHERE Naam = 'basis'");
  if (bestaandeSeed) return;
  await voerQueryUit(database, "PRAGMA busy_timeout = 5000");
  await voerQueryUit(database, "BEGIN IMMEDIATE");
  try {
    // Controleert nogmaals na de lock, zodat gelijktijdige aanvragen maar eenmaal seeden.
    const [seed] = await haalRijenOp(database, "SELECT Naam FROM OntwikkelSeed WHERE Naam = 'basis'");
    if (!seed) {
      await voerDatabaseSqlUit(database, await readFile(databaseSeedPad, "utf8"));
      await voerQueryUit(database, "INSERT INTO OntwikkelSeed (Naam) VALUES ('basis')");
    }
    await voerQueryUit(database, "COMMIT");
  } catch (fout) {
    await voerQueryUit(database, "ROLLBACK");
    throw fout;
  }
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
      await initialiseerVoorbeelddata(database);
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
