import { findAll, findAvailable, getTypes, findById, create, purchase, update, cancel, BestellingFout } from "../models/ticket.js";
import { valideerTicket } from "../../lib/ticket-validatie.js";
import { logInfo, logFout } from "../../lib/logger.js";

/**
 * Controller voor Tickets API
 * Verwerkt requests voor tickets endpoints
 */

export async function handleIndex() {
  try {
    const tickets = await findAll();
    return Response.json(tickets);
  } catch (fout) {
    console.error("Tickets ophalen mislukt:", fout);
    return Response.json(
      { error: "Tickets konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function handleAvailable() {
  try {
    const tickets = await findAvailable();
    return Response.json(tickets);
  } catch (fout) {
    console.error("Beschikbare tickets ophalen mislukt:", fout);
    return Response.json(
      { error: "Tickets konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function handleTypes() {
  try {
    const types = await getTypes();
    return Response.json(types);
  } catch (fout) {
    console.error("Tickettypes ophalen mislukt:", fout);
    return Response.json(
      { error: "Tickettypes konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function handleShow(id) {
  try {
    const ticket = await findById(id);
    if (!ticket) {
      return Response.json({ error: "Ticket niet gevonden." }, { status: 404 });
    }
    return Response.json(ticket);
  } catch (fout) {
    console.error("Ticket ophalen mislukt:", fout);
    return Response.json(
      { error: "Ticket kon niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function handleCreate(request) {
  let invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  try {
    const id = await create(invoer);
    return Response.json({ id }, { status: 201 });
  } catch (fout) {
    console.error("Ticket toevoegen mislukt:", fout);
    return Response.json(
      { error: "Het ticket kon niet worden toegevoegd." },
      { status: 500 }
    );
  }
}

export async function handlePurchase(request) {
  let invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const { ticketId, naam, email, aantal } = invoer;

  if (!ticketId || !naam || !email || !aantal) {
    return Response.json(
      { error: "Vul alle verplichte velden in." },
      { status: 400 }
    );
  }

  try {
    const resultaat = await purchase({ ticketId, naam, email, aantal });
    return Response.json(resultaat, { status: 201 });
  } catch (fout) {
    if (fout instanceof BestellingFout) {
      return Response.json({ error: fout.message }, { status: 400 });
    }
    console.error("Ticket kopen mislukt:", fout);
    return Response.json(
      { error: "De bestelling kon niet worden verwerkt." },
      { status: 500 }
    );
  }
}

// Meldingen uit de acceptatiecriteria van PBI 372 (Ticket wijzigen)
const MELDING_WIJZIGEN_SUCCES = "De wijzigingen zijn succesvol opgeslagen.";
const MELDING_WIJZIGEN_FOUT = "Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.";

// Wijzigt een ticket. Wordt aangeroepen door de server action "wijzigTicket".
// Geeft altijd een "state" terug voor het formulier: success, invalid (veldfouten) of error (systeemfout).
export async function handleUpdate(id, values) {
  // Systeemfout: er wordt niets opgeslagen en de ingevulde waarden blijven staan.
  const systeemFout = () => ({
    status: "error",
    message: MELDING_WIJZIGEN_FOUT,
    errors: {},
    values,
  });

  if (!/^\d+$/.test(String(id))) {
    await logFout("tickets.wijzigen", `Ongeldig ticket-id: ${id}`);
    return systeemFout();
  }

  let ticketTypes;
  try {
    ticketTypes = await getTypes();
  } catch (fout) {
    await logFout("tickets.wijzigen", `Tickettypes ophalen mislukt (ticket ${id})`, fout);
    return systeemFout();
  }

  // Unhappy scenario: een verplicht veld is leeg of ongeldig -> niets opslaan
  const errors = valideerTicket(values, ticketTypes);
  if (Object.keys(errors).length > 0) {
    await logInfo(
      "tickets.wijzigen",
      `Ticket ${id} niet gewijzigd, ongeldige velden: ${Object.keys(errors).join(", ")}`,
    );
    return { status: "invalid", message: MELDING_WIJZIGEN_FOUT, errors, values };
  }

  try {
    await update(Number(id), {
      ticketnaam: values.ticketnaam,
      tickettypeId: Number(values.tickettypeId),
      prijs: Math.round(Number(values.prijs.replace(",", ".")) * 100) / 100,
      aantalBeschikbaar: Number(values.aantalBeschikbaar),
      evenementdatum: values.evenementdatum,
      beschrijving: values.beschrijving || null,
    });
  } catch (fout) {
    await logFout("tickets.wijzigen", `Ticket ${id} wijzigen mislukt`, fout);
    return systeemFout();
  }

  // Happy scenario: opgeslagen
  await logInfo("tickets.wijzigen", `Ticket ${id} gewijzigd`);
  return { status: "success", message: MELDING_WIJZIGEN_SUCCES, errors: {}, values };
}

// Meldingen uit de acceptatiecriteria van PBI 373 (Ticket annuleren)
const MELDING_ANNULEREN_SUCCES = "Het ticket is succesvol geannuleerd.";
const MELDING_ANNULEREN_FOUT = "Er is een fout opgetreden. Het ticket kon niet worden geannuleerd.";

// Annuleert een ticket. Wordt aangeroepen door de server action "annuleerTicket".
// Gebruikt of al geannuleerd? Dan wijzigt de database niets en komt hier de foutmelding.
export async function handleCancel(id) {
  if (!/^\d+$/.test(String(id))) {
    await logFout("tickets.annuleren", `Ongeldig ticket-id: ${id}`);
    return { status: "error", message: MELDING_ANNULEREN_FOUT };
  }

  try {
    await cancel(Number(id));
  } catch (fout) {
    await logFout("tickets.annuleren", `Ticket ${id} niet geannuleerd`, fout);
    return { status: "error", message: MELDING_ANNULEREN_FOUT };
  }

  await logInfo("tickets.annuleren", `Ticket ${id} geannuleerd`);
  return { status: "success", message: MELDING_ANNULEREN_SUCCES };
}