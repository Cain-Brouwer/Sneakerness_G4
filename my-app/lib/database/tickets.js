import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
  voerQueryUit,
} from "./db.js";

// Haalt alle tickettypes op uit de database (voor de dropdown).
export async function getTicketTypes() {
  const database = await initialiseerDatabase();

  try {
    return await haalRijenOp(
      database,
      "SELECT id, Naam FROM tickettypes ORDER BY id",
    );
  } finally {
    await sluitDatabase(database);
  }
}

// Slaat een nieuw ticket op in de database en geeft het id van het nieuwe ticket terug.
export async function createTicket(ticket) {
  const database = await initialiseerDatabase();

  try {
    const resultaat = await voerQueryUit(
      database,
      `INSERT INTO tickets
          (Ticketnaam, TickettypeId, Prijs, AantalBeschikbaar, Evenementdatum, Beschrijving, Datumaangemaakt, Datumgewijzigd)
       VALUES (?, ?, ?, ?, ?, ?, DATE('now'), DATE('now'))`,
      [
        ticket.ticketnaam,
        ticket.tickettypeId,
        ticket.prijs,
        ticket.aantalBeschikbaar,
        ticket.evenementdatum,
        ticket.beschrijving,
      ],
    );

    return resultaat.id;
  } finally {
    await sluitDatabase(database);
  }
}