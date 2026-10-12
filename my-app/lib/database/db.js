import { mkdir } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { voegDemoDataToe } from "./DemoData.js";

const standaardDatabasePad = path.join(
  process.cwd(),
  "lib",
  "database",
  "sneakerness.sqlite3",
);

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

export function maakBevestigingAan(database, bestellerNaam, bestellerEmail, aantalTickets, ticketType, prijs, status) {
    return voerQueryUit(database, `
        INSERT INTO bevestigingen (BestellerNaam, BestellerEmail, AantalTickets, TicketType, Prijs, Status, Datumaangemaakt)
        VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))
    `, [bestellerNaam, bestellerEmail, aantalTickets, ticketType, prijs, status]);
}

export function haalBevestigingOp(database, id) {
    return haalRijenOp(database, `
        SELECT id, BestellerNaam, BestellerEmail, AantalTickets, TicketType, Prijs, Status, Datumaangemaakt
        FROM bevestigingen
        WHERE id = ?
    `, [id]);
}

export function voegContactpersoonToe(database, naam, telefoonnummer, email, isActief, opmerking) {
    return voerQueryUit(database, `
        INSERT INTO contactpersonen (Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
        VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now'))
    `, [naam, telefoonnummer, email, isActief, opmerking]);
}

export function koppelenContactpersoonAanVerkoper(database, verkoperId, contactpersoonId) {
    return voerQueryUit(database, `
        INSERT INTO verkoper_contactpersoon (VerkoperId, ContactpersoonId)
        VALUES (?, ?)
    `, [verkoperId, contactpersoonId]);
}

export function haalGekoppeldeContactpersonenOp(database, verkoperId) {
    return haalRijenOp(database, `
        SELECT c.id, c.Naam, c.Telefoonnummer, c.Email
        FROM contactpersonen c
        INNER JOIN verkoper_contactpersoon vc ON c.id = vc.ContactpersoonId
        WHERE vc.VerkoperId = ?
        ORDER BY c.Naam COLLATE NOCASE
    `, [verkoperId]);
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

async function initialiseerContactpersoonTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS contactpersonen (
        id INTEGER PRIMARY KEY
        ,Naam TEXT
        ,Telefoonnummer TEXT
        ,Email TEXT
        ,IsActief INTEGER
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT
        ,Datumgewijzigd TEXT
    );
  `);
}

async function initialiseerVerkoperContactpersoonTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS verkoper_contactpersoon (
        id INTEGER PRIMARY KEY AUTOINCREMENT
        ,VerkoperId INTEGER NOT NULL
        ,ContactpersoonId INTEGER NOT NULL
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,FOREIGN KEY (VerkoperId) REFERENCES Verkoper(Id)
        ,FOREIGN KEY (ContactpersoonId) REFERENCES contactpersonen(id)
        ,UNIQUE(VerkoperId, ContactpersoonId)
    );
  `);
}

async function initialiseerBevestigingTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS bevestigingen (
        id INTEGER PRIMARY KEY AUTOINCREMENT
        ,BestellerNaam TEXT NOT NULL
        ,BestellerEmail TEXT NOT NULL
        ,AantalTickets INTEGER NOT NULL DEFAULT 1
        ,TicketType TEXT NOT NULL
        ,Prijs TEXT NOT NULL
        ,Status TEXT NOT NULL DEFAULT 'afgerond'
            CHECK (Status IN ('afgerond', 'fout'))
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  if (process.env.FORCE_DB_ERROR === "1") {
    throw new Error("Geen verbinding met de database");
  }

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
    await initialiseerContactpersoonTabel(database);
    await initialiseerVerkoperContactpersoonTabel(database);
    await initialiseerBevestigingTabel(database);

    if (moetVoorbeelddataToevoegen()) {
      await voegDemoDataToe(database);
    }

    return database;
  } catch (fout) {
    await sluitDatabase(database);
    throw fout;
  }
}
