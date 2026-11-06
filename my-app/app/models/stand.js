import { initialiseerDatabase, sluitDatabase, haalRijenOp } from "../../lib/database/db.js";
import {
  voegStandToe as voegStandToeDatabase,
  wijzigStand as wijzigStandDatabase,
  verwijderStand as verwijderStandDatabase,
} from "../../lib/database/stands.js";

export async function verwijderStand(id) {
  return verwijderStandDatabase(id);
}

export async function wijzigStand(id, gegevens) {
  return wijzigStandDatabase(id, gegevens);
}

export async function haalStandWijziggegevensOp(id) {
  const database = await initialiseerDatabase();
  try {
    const [stand] = await haalRijenOp(database, `
      SELECT s.Id AS id, s.Standnummer AS standnummer, s.Standtype AS standtype,
        s.Locatie AS locatie, s.Grootte AS grootte, s.PrijsCenten AS prijsCenten,
        s.Status AS status, s.VerkoperId AS verkoperId,
        EXISTS (SELECT 1 FROM StandReservering r WHERE r.StandId = s.Id) AS heeftReservering
      FROM Stand s WHERE s.Id = ?
    `, [id]);
    if (!stand) return null;
    const verkopers = await haalRijenOp(database, `
      SELECT Id AS id, Naam AS naam, Isactief AS isactief FROM Verkoper
      WHERE Isactief = 1 OR Id = ? ORDER BY Naam COLLATE NOCASE, Id
    `, [stand.verkoperId]);
    return { stand: { ...stand, heeftReservering: Boolean(stand.heeftReservering) }, verkopers };
  } finally {
    await sluitDatabase(database);
  }
}

/**
 * Model voor Stand
 * Verantwoordelijk voor het ophalen en opslaan van stands data
 */

// Haalt alle stands op, optioneel gefilterd op zoekterm en type
export async function findAll({ zoekterm, standtype } = {}) {
  const database = await initialiseerDatabase();
  try {
    const voorwaarden = [];
    const parameters = [];

    if (zoekterm) {
      const ontsnaptZoekterm = zoekterm
        .replaceAll("\\", "\\\\")
        .replaceAll("%", "\\%")
        .replaceAll("_", "\\_");
      voorwaarden.push("Standnummer LIKE ? ESCAPE '\\' COLLATE NOCASE");
      parameters.push(`%${ontsnaptZoekterm}%`);
    }

    if (standtype) {
      voorwaarden.push("Standtype = ?");
      parameters.push(standtype);
    }

    const where = voorwaarden.length > 0
      ? `WHERE ${voorwaarden.join(" AND ")}`
      : "";

    return await haalRijenOp(
      database,
      `SELECT Id AS id, Standnummer AS standnummer, Standtype AS standtype
       FROM Stand
       ${where}
       ORDER BY Standnummer COLLATE NOCASE, Id`,
      parameters,
    );
  } finally {
    await sluitDatabase(database);
  }
}

// Haalt een stand op ID
export async function findById(id) {
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(
      database,
      "SELECT Id AS id, Standnummer AS standnummer, Standtype AS standtype, Locatie AS locatie, Grootte AS grootte, PrijsCenten AS prijsCenten, Status AS status, Opmerking AS opmerking FROM Stand WHERE Id = ?",
      [id],
    );
    return rijen[0] || null;
  } finally {
    await sluitDatabase(database);
  }
}

// Voegt een nieuwe stand toe
export async function create(gegevens) {
  return await voegStandToeDatabase(gegevens);
}
