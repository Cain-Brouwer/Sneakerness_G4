import { initialiseerDatabase, sluitDatabase, haalRijenOp } from "../../lib/database/db.js";
import { voegVerkoperToe as voegVerkoperToeDatabase, koppelenContactpersoonAanVerkoper as koppelenContactpersoonAanVerkoperDatabase } from "../../lib/database/verkopers.js";

/**
 * Model voor Verkoper
 * Verantwoordelijk voor het ophalen en opslaan van verkopers data
 */

// Haalt alle verkopers op, optioneel gefilterd
export async function findAll({ zoekterm, dagen, specialeStatus } = {}) {
  const database = await initialiseerDatabase();
  try {
    const voorwaarden = [];
    const parameters = [];

    if (zoekterm) {
      const ontsnaptZoekterm = zoekterm
        .replaceAll("\\", "\\\\")
        .replaceAll("%", "\\%")
        .replaceAll("_", "\\_");
      const zoekwaarde = `%${ontsnaptZoekterm}%`;
      voorwaarden.push(`(
        v.Naam LIKE ? ESCAPE '\\' COLLATE NOCASE OR
        v.VerkooptSoort LIKE ? ESCAPE '\\' COLLATE NOCASE
      )`);
      parameters.push(zoekwaarde, zoekwaarde);
    }

    if (dagen) {
      voorwaarden.push("v.Dagen = ?");
      parameters.push(Number(dagen));
    }

    if (specialeStatus !== undefined && specialeStatus !== "") {
      voorwaarden.push("v.SpecialeStatus = ?");
      parameters.push(specialeStatus === "true" ? 1 : 0);
    }

    const where = voorwaarden.length > 0
      ? `WHERE ${voorwaarden.join(" AND ")}`
      : "";

    const rijen = await haalRijenOp(
      database,
      `SELECT
         v.Id AS id,
         v.Naam AS naam,
         v.SpecialeStatus AS specialeStatus,
         v.VerkooptSoort AS verkooptSoort,
         v.Dagen AS dagen,
         v.Logo AS logo,
         c.id AS contactId,
         c.Naam AS contactNaam
       FROM Verkoper v
       LEFT JOIN verkoper_contactpersoon vc ON v.Id = vc.VerkoperId
       LEFT JOIN contactpersonen c ON c.id = vc.ContactpersoonId
       ${where}
       ORDER BY v.Naam COLLATE NOCASE, v.Id, c.Naam COLLATE NOCASE`,
      parameters,
    );

    // Groepeer rijen per verkoper en verzamel gekoppelde contactpersonen
    const verkoperMap = new Map();
    for (const rij of rijen) {
      if (!verkoperMap.has(rij.id)) {
        verkoperMap.set(rij.id, {
          id: rij.id,
          naam: rij.naam,
          specialeStatus: Boolean(rij.specialeStatus),
          verkooptSoort: rij.verkooptSoort,
          dagen: rij.dagen,
          logo: rij.logo,
        });
      }
    }

    return Array.from(verkoperMap.values());
  } finally {
    await sluitDatabase(database);
  }
}

// Haalt een verkoper op ID met contactpersonen
export async function findById(id) {
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(
      database,
      `SELECT
         v.Id AS id,
         v.Naam AS naam,
         v.SpecialeStatus AS specialeStatus,
         v.VerkooptSoort AS verkooptSoort,
         v.Dagen AS dagen,
         v.Logo AS logo,
         v.Adres AS adres,
         v.Postcode AS postcode,
         v.Plaats AS plaats,
         v.Opmerking AS opmerking,
         c.id AS contactId,
         c.Naam AS contactNaam,
         c.Telefoonnummer AS contactTelefoon,
         c.Email AS contactEmail
       FROM Verkoper v
       LEFT JOIN verkoper_contactpersoon vc ON v.Id = vc.VerkoperId
       LEFT JOIN contactpersonen c ON c.id = vc.ContactpersoonId
       WHERE v.Id = ?
       ORDER BY c.Naam COLLATE NOCASE`,
      [id],
    );

    if (rijen.length === 0) return null;

    const verkoper = {
      id: rijen[0].id,
      naam: rijen[0].naam,
      specialeStatus: Boolean(rijen[0].specialeStatus),
      verkooptSoort: rijen[0].verkooptSoort,
      dagen: rijen[0].dagen,
      logo: rijen[0].logo,
      adres: rijen[0].adres,
      postcode: rijen[0].postcode,
      plaats: rijen[0].plaats,
      opmerking: rijen[0].opmerking,
      contactpersonen: [],
    };

    for (const rij of rijen) {
      if (rij.contactId) {
        verkoper.contactpersonen.push({
          id: rij.contactId,
          naam: rij.contactNaam,
          telefoon: rij.contactTelefoon,
          email: rij.contactEmail,
        });
      }
    }

    return verkoper;
  } finally {
    await sluitDatabase(database);
  }
}

// Voegt een nieuwe verkoper toe
export async function create(gegevens) {
  return await voegVerkoperToeDatabase(gegevens);
}

// Koppelt een contactpersoon aan een verkoper
export async function koppelContactpersoon(verkoperId, contactpersoonId) {
  const database = await initialiseerDatabase();
  try {
    // Controleer of de verkoper bestaat
    const verkoper = await haalRijenOp(
      database,
      `SELECT Id FROM Verkoper WHERE Id = ?`,
      [verkoperId]
    );

    if (verkoper.length === 0) {
      throw new Error('Verkoper niet gevonden');
    }

    // Controleer of de contactpersoon bestaat
    const contactpersoon = await haalRijenOp(
      database,
      `SELECT id FROM contactpersonen WHERE id = ?`,
      [contactpersoonId]
    );

    if (contactpersoon.length === 0) {
      throw new Error('Contactpersoon niet gevonden');
    }

    // Koppel de contactpersoon aan de verkoper
    await koppelenContactpersoonAanVerkoperDatabase(database, verkoperId, contactpersoonId);
  } finally {
    await sluitDatabase(database);
  }
}
