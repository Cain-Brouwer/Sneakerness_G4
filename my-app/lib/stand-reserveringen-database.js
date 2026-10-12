import { initialiseerDatabase, haalRijenOp, voerQueryUit, sluitDatabase } from "./database/db.js";

export async function haalBeschikbareStandsOp(database) {
  return haalRijenOp(database, `
    SELECT Id AS id, Standnummer AS standnummer, Standtype AS standtype,
      Locatie AS locatie, PrijsCenten AS prijsCenten, Status AS status
    FROM Stand s WHERE Isactief = 1 AND Status = 'Beschikbaar' AND VerkoperId IS NULL
      AND NOT EXISTS (SELECT 1 FROM StandReservering r WHERE r.StandId = s.Id)
    ORDER BY Standnummer COLLATE NOCASE, Id
  `);
}

export async function haalReserveringsgegevensOp() {
  const database = await initialiseerDatabase();
  try {
    const stands = await haalBeschikbareStandsOp(database);
    const verkopers = await haalRijenOp(database, "SELECT Id AS id, Naam AS naam FROM Verkoper WHERE Isactief = 1 ORDER BY Naam COLLATE NOCASE, Id");
    const reserveringen = await haalRijenOp(database, `
      SELECT s.Id AS standId, s.Standnummer AS standnummer, s.Status AS status,
        v.Naam AS verkoperNaam, r.Evenementdatum AS evenementdatum,
        r.Startdatum AS startdatum, r.Einddatum AS einddatum
      FROM Stand s JOIN Verkoper v ON v.Id = s.VerkoperId
      LEFT JOIN StandReservering r ON r.StandId = s.Id
      WHERE s.Status = 'Gereserveerd' AND s.Isactief = 1
      ORDER BY s.Standnummer COLLATE NOCASE, s.Id
    `);
    return { stands, verkopers, reserveringen };
  } finally {
    await sluitDatabase(database);
  }
}

function maakReserveringsfout(status, melding, fouten) {
  return Object.assign(new Error(melding), { status, fouten });
}

export async function reserveerStand(gegevens) {
  const database = await initialiseerDatabase();
  try {
    await voerQueryUit(database, "PRAGMA busy_timeout = 5000");
    // Eén schrijftransactie voorkomt dubbele reserveringen bij gelijktijdige aanvragen.
    await voerQueryUit(database, "BEGIN IMMEDIATE");
    try {
      const [verkoper] = await haalRijenOp(database, "SELECT Id FROM Verkoper WHERE Id = ? AND Isactief = 1", [gegevens.verkoperId]);
      if (!verkoper) throw maakReserveringsfout(400, "Kies een geregistreerde, actieve verkoper.", { verkoperId: "Deze verkoper is niet beschikbaar." });
      const wijziging = await voerQueryUit(database, `
        UPDATE Stand SET VerkoperId = ?, Status = 'Gereserveerd', Datumgewijzigd = CURRENT_TIMESTAMP
        WHERE Id = ? AND Isactief = 1 AND Status = 'Beschikbaar' AND VerkoperId IS NULL
          AND NOT EXISTS (SELECT 1 FROM StandReservering WHERE StandId = Stand.Id)
      `, [gegevens.verkoperId, gegevens.standId]);
      if (wijziging.wijzigingen !== 1) throw maakReserveringsfout(409, "Deze stand is niet meer beschikbaar.", { standId: "Kies een andere beschikbare stand." });
      const reservering = await voerQueryUit(database, `
        INSERT INTO StandReservering (StandId, Evenementdatum, Startdatum, Einddatum, Opmerking)
        VALUES (?, ?, ?, ?, ?)
      `, [gegevens.standId, gegevens.evenementdatum, gegevens.startdatum, gegevens.einddatum, gegevens.opmerking || null]);
      await voerQueryUit(database, "COMMIT");
      return { id: reservering.id, standId: gegevens.standId, verkoperId: gegevens.verkoperId, status: "Gereserveerd" };
    } catch (fout) {
      await voerQueryUit(database, "ROLLBACK");
      throw fout;
    }
  } finally {
    await sluitDatabase(database);
  }
}
