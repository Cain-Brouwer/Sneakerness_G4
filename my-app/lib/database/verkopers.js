import { initialiseerDatabase, sluitDatabase, voerQueryUit, haalRijenOp } from "./db.js";
import { voegContactpersoonToe } from "./contactpersonen.js";

// Voegt een nieuwe verkoper toe, inclusief een gekoppelde contactpersoon.
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

// Koppelt een contactpersoon aan een verkoper.
export async function koppelenContactpersoonAanVerkoper(database, verkoperId, contactpersoonId) {
    return voerQueryUit(database, `
        INSERT INTO verkoper_contactpersoon (VerkoperId, ContactpersoonId)
        VALUES (?, ?)
    `, [verkoperId, contactpersoonId]);
}

// Haalt alle contactpersonen op die aan een verkoper gekoppeld zijn.
export async function haalGekoppeldeContactpersonenOp(database, verkoperId) {
    return haalRijenOp(database, `
        SELECT c.id, c.Naam, c.Telefoonnummer, c.Email
        FROM contactpersonen c
        INNER JOIN verkoper_contactpersoon vc ON c.id = vc.ContactpersoonId
        WHERE vc.VerkoperId = ?
        ORDER BY c.Naam COLLATE NOCASE
    `, [verkoperId]);
}
