import { initialiseerDatabase, sluitDatabase, voerQueryUit, haalRijenOp } from "../../lib/database/db.js";
import { voegContactpersoonToe as voegContactpersoonToeDatabase } from "../../lib/database/contactpersonen.js";

/**
 * Model voor Contactpersoon
 * Verantwoordelijk voor het ophalen en opslaan van contactpersonen data
 */

// Haalt alle contactpersonen op uit de database
export async function findAll() {
  const database = await initialiseerDatabase();
  try {
    return await haalRijenOp(
      database,
      "SELECT id, Naam, Telefoonnummer, Email FROM contactpersonen",
    );
  } finally {
    await sluitDatabase(database);
  }
}

// Haalt een contactpersoon op ID op
export async function findById(id) {
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(
      database,
      "SELECT id, Naam, Telefoonnummer, Email, IsActief, Opmerking FROM contactpersonen WHERE id = ?",
      [id],
    );
    return rijen[0] || null;
  } finally {
    await sluitDatabase(database);
  }
}

// Voegt een nieuwe contactpersoon toe
export async function create({ naam, telefoonnummer, email, isActief, opmerking }) {
  const database = await initialiseerDatabase();
  try {
    const resultaat = await voegContactpersoonToeDatabase(
      database, naam, telefoonnummer, email, isActief, opmerking
    );
    return { id: resultaat.id };
  } finally {
    await sluitDatabase(database);
  }
}

// Koppelt een contactpersoon aan een verkoper
export async function koppelenAanVerkoper(database, verkoperId, contactpersoonId) {
  return voerQueryUit(database, `
      INSERT INTO verkoper_contactpersoon (VerkoperId, ContactpersoonId)
      VALUES (?, ?)
  `, [verkoperId, contactpersoonId]);
}

// Haalt alle contactpersonen op die aan een verkoper gekoppeld zijn
export async function findByVerkoperId(verkoperId) {
  const database = await initialiseerDatabase();
  try {
    return await haalRijenOp(database, `
        SELECT c.id, c.Naam, c.Telefoonnummer, c.Email
        FROM contactpersonen c
        INNER JOIN verkoper_contactpersoon vc ON c.id = vc.ContactpersoonId
        WHERE vc.VerkoperId = ?
        ORDER BY c.Naam COLLATE NOCASE
    `, [verkoperId]);
  } finally {
    await sluitDatabase(database);
  }
}
