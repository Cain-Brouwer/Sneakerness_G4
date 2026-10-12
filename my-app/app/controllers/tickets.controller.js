import { findAll, findAvailable, getTypes, findById, create, purchase, BestellingFout } from "../models/ticket.js";

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
