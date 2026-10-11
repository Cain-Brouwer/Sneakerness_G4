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

export function voegContactpersoonToe(database, naam, telefoonnummer, email, isActief, opmerking) {
  return voerQueryUit(
    database,
    `
      INSERT INTO contactpersonen (Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
      VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now'))
    `,
    [naam, telefoonnummer, email, isActief, opmerking]
  );
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
  await voerDatabaseSqlUit(
    database,
    `
    CREATE TABLE IF NOT EXISTS Verkoper (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Naam TEXT NOT NULL,
        SpecialeStatus INTEGER NOT NULL DEFAULT 0 CHECK (SpecialeStatus IN (0, 1)),
        VerkooptSoort TEXT NOT NULL,
        Dagen INTEGER NOT NULL CHECK (Dagen IN (1, 2)),
        Logo TEXT,
        Isactief INTEGER NOT NULL DEFAULT 1 CHECK (Isactief IN (0, 1)),
        Opmerking TEXT,
        Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `
  );
}

async function initialiseerStandTabel(database) {
  await voerDatabaseSqlUit(
    database,
    `
    CREATE TABLE IF NOT EXISTS Stand (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Standnummer TEXT NOT NULL UNIQUE,
        Standtype TEXT NOT NULL CHECK (Standtype IN ('aa-plus', 'aa', 'a', 'side-stand')),
        Isactief INTEGER NOT NULL DEFAULT 1 CHECK (Isactief IN (0, 1)),
        Opmerking TEXT,
        Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `
  );
}

async function initialiseerContactpersoonTabel(database) {
  await voerDatabaseSqlUit(
    database,
    `
    CREATE TABLE IF NOT EXISTS contactpersonen (
        id INTEGER PRIMARY KEY,
        Naam TEXT,
        Telefoonnummer TEXT,
        Email TEXT,
        IsActief INTEGER,
        Opmerking TEXT,
        Datumaangemaakt TEXT,
        Datumgewijzigd TEXT
    );
  `
  );
}

async function initialiseerTicketTabellen(database) {
  await voerDatabaseSqlUit(
    database,
    `
    CREATE TABLE IF NOT EXISTS tickettypes (
        id INTEGER PRIMARY KEY,
        Naam TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Ticketnaam TEXT NOT NULL,
        TickettypeId INTEGER NOT NULL,
        Prijs REAL NOT NULL,
        AantalBeschikbaar INTEGER NOT NULL,
        Evenementdatum DATE NOT NULL,
        Beschrijving TEXT,
        Datumaangemaakt DATE,
        Datumgewijzigd DATE,
        FOREIGN KEY (TickettypeId) REFERENCES tickettypes (id)
    );

    INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (1, 'Dagkaart');
    INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (2, 'Weekendpas');
    INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (3, 'Early Entry');
  `
  );
}

function moetVoorbeelddataToevoegen() {
  return (
    process.env.NODE_ENV !== "production" &&
    !process.env.SQLITE_DATABASE_PATH &&
    !process.env.STANDS_DATABASE_PATH
  );
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
  if (process.env.FORCE_DB_ERROR === "1") {
    throw new Error("Geen verbinding met de database");
  }

  const databasePad =
    process.env.SQLITE_DATABASE_PATH ??
    process.env.STANDS_DATABASE_PATH ??
    standaardDatabasePad;

  await mkdir(path.dirname(databasePad), { recursive: true });

  const database = await openDatabase(databasePad);

  try {
    await schakelForeignKeysIn(database);
    await initialiseerVerkoperTabel(database);
    await initialiseerStandTabel(database);
    await initialiseerContactpersoonTabel(database);
    await initialiseerVerkoperToevoegenSchema(database);
    await initialiseerTicketTabellen(database); // tickets toegevoegd

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

async function initialiseerVerkoperToevoegenSchema(database) {
  const kolommen = await haalRijenOp(database, "PRAGMA table_info(Verkoper)");

  for (const naam of ["Adres", "Postcode", "Plaats"]) {
    if (!kolommen.some((kolom) => kolom.name.toLowerCase() === naam.toLowerCase())) {
      try {
        await voerQueryUit(database, `ALTER TABLE Verkoper ADD COLUMN ${naam} TEXT`);
      } catch (fout) {
        if (!fout.message.includes("duplicate column name:")) throw fout;
        const actueleKolommen = await haalRijenOp(database, "PRAGMA table_info(Verkoper)");
        if (!actueleKolommen.some((kolom) => kolom.name.toLowerCase() === naam.toLowerCase())) {
          throw fout;
        }
      }
    }
  }

  await voerDatabaseSqlUit(
    database,
    `
    CREATE TABLE IF NOT EXISTS Contactpersoonverkoper (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        VerkoperId INTEGER NOT NULL REFERENCES Verkoper(Id),
        ContactpersoonId INTEGER NOT NULL REFERENCES contactpersonen(id),
        UNIQUE (VerkoperId, ContactpersoonId)
    );
  `
  );
}

export async function voegVerkoperToe(gegevens) {
  const database = await initialiseerDatabase();
  try {
    await voerQueryUit(database, "BEGIN IMMEDIATE");
    try {
      const verkoper = await voerQueryUit(
        database,
        `
        INSERT INTO Verkoper (Naam, VerkooptSoort, Dagen, Adres, Postcode, Plaats, Opmerking)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          gegevens.naam,
          gegevens.verkooptSoort,
          gegevens.dagen,
          gegevens.adres,
          gegevens.postcode,
          gegevens.plaats,
          gegevens.opmerking || null,
        ]
      );

      const contactpersoon = await voegContactpersoonToe(
        database,
        gegevens.contactpersoon,
        gegevens.telefoon || null,
        gegevens.email,
        1,
        null
      );

      await voerQueryUit(
        database,
        `
        INSERT INTO Contactpersoonverkoper (VerkoperId, ContactpersoonId) VALUES (?, ?)
      `,
        [verkoper.id, contactpersoon.id]
      );

      await voerQueryUit(database, "COMMIT");
      return { id: verkoper.id };
    } catch (fout) {
      await voerQueryUit(database, "ROLLBACK");
      throw fout;
    }
  } finally {
    await sluitDatabase(database);
  }
}