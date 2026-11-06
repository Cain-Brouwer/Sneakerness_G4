import { initialiseerDatabase, sluitDatabase, voerQueryUit, haalRijenOp } from "./db.js";
import { voegContactpersoonToe } from "./contactpersonen.js";

export async function wijzigVerkoper(verkoperId, gegevens) {
  const database = await initialiseerDatabase();
  try {
    await voerQueryUit(database, "PRAGMA busy_timeout = 5000");
    // Bedrijfsgegevens en contactgegevens worden samen opgeslagen of teruggedraaid.
    await voerQueryUit(database, "BEGIN IMMEDIATE");
    try {
      const [verkoper] = await haalRijenOp(database, "SELECT Id FROM Verkoper WHERE Id = ?", [verkoperId]);
      if (!verkoper) throw Object.assign(new Error("Verkoper niet gevonden."), { status: 404 });
      const koppelingen = await haalRijenOp(database, `
        SELECT ContactpersoonId AS id FROM verkoper_contactpersoon WHERE VerkoperId = ?
        UNION
        SELECT ContactpersoonId AS id FROM Contactpersoonverkoper WHERE VerkoperId = ?
      `, [verkoperId, verkoperId]);
      let contactpersoonId = gegevens.contactpersoonId;
      if ((contactpersoonId === null && koppelingen.length > 0)
        || (contactpersoonId !== null && !koppelingen.some(koppeling => koppeling.id === contactpersoonId))) {
        throw Object.assign(new Error("De contactpersoonkoppeling is gewijzigd. Laad de verkoper opnieuw."), { status: 409 });
      }
      await voerQueryUit(database, `
        UPDATE Verkoper SET Naam = ?, Adres = ?, Datumgewijzigd = CURRENT_TIMESTAMP WHERE Id = ?
      `, [gegevens.naam, gegevens.adres, verkoperId]);
      if (contactpersoonId === null) {
        const contactpersoon = await voegContactpersoonToe(database, gegevens.contactpersoon, gegevens.telefoon || null, gegevens.email, 1, null);
        contactpersoonId = contactpersoon.id;
        await voerQueryUit(database, "INSERT INTO verkoper_contactpersoon (VerkoperId, ContactpersoonId) VALUES (?, ?)", [verkoperId, contactpersoonId]);
      } else {
        await voerQueryUit(database, `
          UPDATE contactpersonen SET Naam = ?, Email = ?, Telefoonnummer = ?, Datumgewijzigd = CURRENT_TIMESTAMP WHERE id = ?
        `, [gegevens.contactpersoon, gegevens.email, gegevens.telefoon || null, contactpersoonId]);
      }
      await voerQueryUit(database, "COMMIT");
      return { id: verkoperId, contactpersoonId };
    } catch (fout) {
      await voerQueryUit(database, "ROLLBACK");
      throw fout;
    }
  } finally {
    await sluitDatabase(database);
  }
}

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

// Verwijdert de koppeling tussen een contactpersoon en een verkoper.
export async function ontkoppelContactpersoonVanVerkoper(database, verkoperId, contactpersoonId) {
    await voerQueryUit(database, `
        DELETE FROM verkoper_contactpersoon
        WHERE VerkoperId = ? AND ContactpersoonId = ?
    `, [verkoperId, contactpersoonId]);

    await voerQueryUit(database, `
        DELETE FROM Contactpersoonverkoper
        WHERE VerkoperId = ? AND ContactpersoonId = ?
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
