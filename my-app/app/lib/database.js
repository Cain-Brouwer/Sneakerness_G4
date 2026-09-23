import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const standaardDatabasePad = path.join(
  process.cwd(),
  "data",
  "sneakerness.sqlite",
);
const databaseSchemaPad = path.join(process.cwd(), "database.sql");

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

async function bestaatLegacyVerkopertabel(database) {
  const tabellen = await haalRijenOp(
    database,
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table' AND name = 'verkopers'`,
  );

  return tabellen.length > 0;
}

async function controleerLegacyVerkoperdata(database) {
  if (!await bestaatLegacyVerkopertabel(database)) {
    return false;
  }

  const ongeldigeVerkopertypes = await haalRijenOp(
    database,
    `SELECT id
     FROM verkopers
     WHERE type_verkoper NOT IN ('sneakersverkoper', 'side-stand')`,
  );

  if (ongeldigeVerkopertypes.length > 0) {
    throw new Error("Legacy verkopers bevatten ongeldige verkopertypes.");
  }

  return true;
}

async function migreerLegacyVerkopers(database) {
  await voerQueryUit(database, "BEGIN IMMEDIATE TRANSACTION");

  try {
    const conflicten = await haalRijenOp(
      database,
      `SELECT legacy.id
       FROM verkopers AS legacy
       INNER JOIN Verkoper AS nieuw ON nieuw.Id = legacy.id
       WHERE nieuw.Bedrijfsnaam != legacy.bedrijfsnaam
          OR nieuw.Contactpersoon != legacy.contactpersoon
          OR nieuw.Email != legacy.email
          OR nieuw.Telefoon != legacy.telefoon
          OR nieuw.Verkopertype != legacy.type_verkoper`,
    );

    if (conflicten.length > 0) {
      throw new Error("Legacy verkopers conflicteren met bestaande Verkoper-data.");
    }

    await voerQueryUit(
      database,
      `INSERT INTO Verkoper (
         Id, Bedrijfsnaam, Contactpersoon, Email, Telefoon, Verkopertype
       )
       SELECT
         legacy.id,
         legacy.bedrijfsnaam,
         legacy.contactpersoon,
         legacy.email,
         legacy.telefoon,
         legacy.type_verkoper
       FROM verkopers AS legacy
       WHERE NOT EXISTS (
         SELECT 1 FROM Verkoper AS nieuw WHERE nieuw.Id = legacy.id
       )`,
    );

    const ontbrekendeVerkopers = await haalRijenOp(
      database,
      `SELECT legacy.id
       FROM verkopers AS legacy
       LEFT JOIN Verkoper AS nieuw
         ON nieuw.Id = legacy.id
        AND nieuw.Bedrijfsnaam = legacy.bedrijfsnaam
        AND nieuw.Contactpersoon = legacy.contactpersoon
        AND nieuw.Email = legacy.email
        AND nieuw.Telefoon = legacy.telefoon
        AND nieuw.Verkopertype = legacy.type_verkoper
       WHERE nieuw.Id IS NULL`,
    );

    if (ontbrekendeVerkopers.length > 0) {
      throw new Error("Niet alle legacy verkopers konden veilig worden gemigreerd.");
    }

    await voerQueryUit(database, "COMMIT");
  } catch (fout) {
    await voerQueryUit(database, "ROLLBACK");
    throw fout;
  }
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
    const heeftLegacyVerkopertabel = await controleerLegacyVerkoperdata(database);
    const databaseSchema = await readFile(databaseSchemaPad, "utf8");

    // Voert het centrale databaseschema uit.
    await voerDatabaseSchemaUit(database, databaseSchema);

    if (heeftLegacyVerkopertabel) {
      await migreerLegacyVerkopers(database);
    }

    return database;
  } catch (fout) {
    await sluitDatabase(database);
    throw fout;
  }
}
