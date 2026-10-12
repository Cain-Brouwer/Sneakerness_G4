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

// Haalt alle tickets op voor het ticketoverzicht, inclusief de naam van het tickettype.
// Gesorteerd op datum en tijdslot; tickets zonder tijdslot (hele dag) komen per dag als laatste.
export async function getTicketOverview() {
  const database = await initialiseerDatabase();

  try {
    return await haalRijenOp(
      database,
      `SELECT t.id,
              t.Ticketnaam,
              tt.Naam AS Tickettype,
              t.Prijs,
              t.AantalBeschikbaar,
              t.Evenementdatum,
              t.Tijdslot
       FROM tickets t
       JOIN tickettypes tt ON tt.id = t.TickettypeId
       ORDER BY t.Evenementdatum, t.Tijdslot IS NULL, t.Tijdslot, t.id`,
    );
  } finally {
    await sluitDatabase(database);
  }
}