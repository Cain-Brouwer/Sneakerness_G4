import { findAll, findById, create, update, remove } from "../models/contactpersoon.js";

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

export async function handleUpdate(id, request) {
  let invoer;
  try {
    invoer = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Ongeldige aanvraag." }),
      { status: 400 }
    );
  }

  const { naam, telefoonnummer, email, isActief, opmerking } = invoer;

  if (!naam || !telefoonnummer || !email) {
    return new Response(
      JSON.stringify({ error: "Naam, telefoonnummer en email zijn verplicht." }),
      { status: 400 }
    );
  }

  try {
    await update(id, {
      naam, telefoonnummer, email, isActief, opmerking
    });
    return new Response(
      JSON.stringify({ message: "De wijzigingen zijn succesvol opgeslagen." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Fout bij het wijzigen van contactpersoon:", error);
    return new Response(
      JSON.stringify({ error: "Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen." }),
      { status: 500 }
    );
  }
}

// Meldingen uit de acceptatiecriteria van PBI 307 (Contactpersoon verwijderen)
const MELDING_VERWIJDEREN_SUCCES = "De contactpersoon is succesvol verwijderd.";
const MELDING_VERWIJDEREN_FOUT = "Er is een fout opgetreden. De contactpersoon kon niet worden verwijderd.";

export async function handleDelete(id) {
  try {
    await remove(id);
    return new Response(
      JSON.stringify({ message: MELDING_VERWIJDEREN_SUCCES }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Fout bij het verwijderen van contactpersoon:", error);

    if (error.message === 'Contactpersoon niet gevonden') {
      return new Response(
        JSON.stringify({ error: MELDING_VERWIJDEREN_FOUT }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ error: MELDING_VERWIJDEREN_FOUT }),
      { status: 500 }
    );
  }
}
