import { findAll, findById, create } from "../models/contactpersoon.js";

/**
 * Controller voor Contactpersonen API
 * Verwerkt requests voor contactpersonen endpoints
 */

export async function handleCreate(request) {
  const { naam, telefoonnummer, email, isActief, opmerking } = await request.json();

  try {
    const resultaat = await create({
      naam, telefoonnummer, email, isActief, opmerking
    });
    return new Response(JSON.stringify({ id: resultaat.id }), { status: 201 });
  } catch (error) {
    console.error("Fout bij het toevoegen van contactpersoon:", error);
    return new Response(
      JSON.stringify({ error: "Fout bij het toevoegen van contactpersoon" }),
      { status: 500 }
    );
  }
}

export async function handleIndex() {
  try {
    const contactpersonen = await findAll();
    return new Response(JSON.stringify(contactpersonen));
  } catch (error) {
    console.error("Fout bij het ophalen van contactpersonen:", error);
    return new Response(
      JSON.stringify({ error: "Fout bij het ophalen van contactpersonen" }),
      { status: 500 }
    );
  }
}

export async function handleShow(id) {
  try {
    const contactpersoon = await findById(id);
    if (!contactpersoon) {
      return new Response(
        JSON.stringify({ error: "Contactpersoon niet gevonden" }),
        { status: 404 }
      );
    }
    return new Response(JSON.stringify(contactpersoon));
  } catch (error) {
    console.error("Fout bij het ophalen van contactpersoon:", error);
    return new Response(
      JSON.stringify({ error: "Fout bij het ophalen van contactpersoon" }),
      { status: 500 }
    );
  }
}
