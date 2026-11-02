import { initialiseerDatabase, sluitDatabase, voerQueryUit } from "./db.js";

// Voegt een nieuwe stand toe aan de database.
export async function voegStandToe(gegevens) {
  const database = await initialiseerDatabase();
  try {
    // Bewaart geldbedragen in centen om afrondingsverschillen te voorkomen.
    return await voerQueryUit(database, `
      INSERT INTO Stand (Standnummer, Standtype, Locatie, Grootte, PrijsCenten, Status, Opmerking)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [gegevens.standnummer, gegevens.standtype, gegevens.locatie, gegevens.grootte,
      gegevens.prijsCenten, gegevens.status, gegevens.opmerking || null]);
  } finally {
    await sluitDatabase(database);
  }
}
