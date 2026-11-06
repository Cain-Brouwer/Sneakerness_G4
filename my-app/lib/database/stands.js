import { initialiseerDatabase, sluitDatabase, voerQueryUit, haalRijenOp } from "./db.js";

export async function wijzigStand(standId, gegevens) {
  const database = await initialiseerDatabase();
  try {
    await voerQueryUit(database, "PRAGMA busy_timeout = 5000");
    await voerQueryUit(database, "BEGIN IMMEDIATE");
    try {
      const [stand] = await haalRijenOp(database, "SELECT VerkoperId, Status FROM Stand WHERE Id = ?", [standId]);
      if (!stand) throw Object.assign(new Error("Stand niet gevonden."), { status: 404 });
      if (stand.VerkoperId !== gegevens.verwachteVerkoperId) {
        throw Object.assign(new Error("De verkoperkoppeling is intussen gewijzigd. Laad de stand opnieuw."), { status: 409 });
      }
      let status = stand.Status;
      if (stand.VerkoperId !== gegevens.verkoperId) {
        const [reservering] = await haalRijenOp(database, "SELECT Id FROM StandReservering WHERE StandId = ?", [standId]);
        if (gegevens.verkoperId === null) {
          if (reservering) throw Object.assign(new Error("Deze stand heeft een reservering. Handel die eerst af voordat je de verkoper loskoppelt."), { status: 409 });
          if (status === "Gereserveerd") status = "Beschikbaar";
        } else {
          const [verkoper] = await haalRijenOp(database, "SELECT Id FROM Verkoper WHERE Id = ? AND Isactief = 1", [gegevens.verkoperId]);
          if (!verkoper) throw Object.assign(new Error("Kies een bestaande, actieve verkoper."), { status: 400, fouten: { verkoperId: "Deze verkoper is niet beschikbaar." } });
          if (stand.VerkoperId === null && status !== "Beschikbaar") {
            throw Object.assign(new Error("Deze stand is niet beschikbaar voor een nieuwe verkoper."), { status: 409 });
          }
          if (status === "Beschikbaar") status = "Gereserveerd";
        }
      }
      // Standgegevens en verkoperkoppeling veranderen samen; reserveringsdatums blijven intact.
      await voerQueryUit(database, `
        UPDATE Stand SET Standnummer = ?, VerkoperId = ?, Locatie = ?, Grootte = ?,
          PrijsCenten = ?, Status = ?, Datumgewijzigd = CURRENT_TIMESTAMP WHERE Id = ?
      `, [gegevens.standnummer, gegevens.verkoperId, gegevens.locatie, gegevens.grootte,
        gegevens.prijsCenten, status, standId]);
      await voerQueryUit(database, "COMMIT");
      return { id: standId, verkoperId: gegevens.verkoperId, status };
    } catch (fout) {
      await voerQueryUit(database, "ROLLBACK");
      throw fout;
    }
  } finally {
    await sluitDatabase(database);
  }
}

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
