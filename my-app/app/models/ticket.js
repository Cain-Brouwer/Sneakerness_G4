import { initialiseerDatabase, sluitDatabase, haalRijenOp } from "../../lib/database/db.js";
import { createTicket as createTicketDatabase, getTicketOverview, getTicketsVoorVerkoop, getTicketTypes, koopTicket, updateTicket, BestellingFout } from "../../lib/database/tickets.js";

/**
 * Model voor Ticket
 * Verantwoordelijk voor het ophalen en opslaan van tickets data
 */

export { BestellingFout };

// Haalt alle tickettypes op
export async function getTypes() {
  return await getTicketTypes();
}

// Haalt alle tickets op voor overzicht
export async function findAll() {
  return await getTicketOverview();
}

// Haalt tickets op die nog te koop zijn
export async function findAvailable() {
  return await getTicketsVoorVerkoop();
}

// Haalt een ticket op ID
export async function findById(id) {
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(
      database,
      "SELECT id, Ticketnaam, TickettypeId, Prijs, AantalBeschikbaar, Evenementdatum, Tijdslot, Beschrijving FROM tickets WHERE id = ?",
      [id],
    );
    return rijen[0] || null;
  } finally {
    await sluitDatabase(database);
  }
}

// Haalt een ticket op ID inclusief de naam van het tickettype (JOIN met tickettypes).
// Gebruikt door de pagina Ticket wijzigen.
export async function findDetailById(id) {
  const database = await initialiseerDatabase();
  try {
    const rijen = await haalRijenOp(
      database,
      `SELECT t.id,
              t.Ticketnaam,
              t.TickettypeId,
              tt.Naam AS Tickettype,
              t.Prijs,
              t.AantalBeschikbaar,
              t.Evenementdatum,
              t.Tijdslot,
              t.Beschrijving
       FROM tickets t
       JOIN tickettypes tt ON tt.id = t.TickettypeId
       WHERE t.id = ?`,
      [id],
    );
    return rijen[0] || null;
  } finally {
    await sluitDatabase(database);
  }
}

// Maakt een nieuw ticket aan
export async function create(ticket) {
  return await createTicketDatabase(ticket);
}

// Koopt een ticket
export async function purchase({ ticketId, naam, email, aantal }) {
  return await koopTicket({ ticketId, naam, email, aantal });
}

// Past een bestaand ticket aan (PBI 372)
export async function update(id, ticket) {
  return await updateTicket(id, ticket);
}

// Default export zodat de pagina's "import TicketModel from ..." kunnen blijven gebruiken
// (toevoegen/actions.js en kopen/actions.js deden dat al; zonder default export crashte de build).
const TicketModel = {
  getTypes,
  findAll,
  findAvailable,
  findById,
  findDetailById,
  create,
  purchase,
  update,
  BestellingFout,
};

export default TicketModel;