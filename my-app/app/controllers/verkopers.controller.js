import { findAll, findById, create, koppelContactpersoon } from "../models/verkoper.js";
import { valideerNieuweVerkoper } from "../../lib/verkoper-validatie.js";

/**
 * Controller voor Verkopers API
 * Verwerkt requests voor verkopers endpoints
 */

const toegestaneParameters = new Set(["zoek", "dagen", "specialeStatus"]);

function valideerDagen(dagen) {
  return dagen === "" || dagen === "1" || dagen === "2";
}

function valideerSpecialeStatus(specialeStatus) {
  return specialeStatus === ""
    || specialeStatus === "true"
    || specialeStatus === "false";
}

function leesVerkoperFilters(request) {
  const zoekparameters = new URL(request.url).searchParams;

  for (const parameter of zoekparameters.keys()) {
    if (!toegestaneParameters.has(parameter)) {
      return { fout: `Onbekende queryparameter: ${parameter}` };
    }
    if (zoekparameters.getAll(parameter).length > 1) {
      return { fout: `Queryparameter '${parameter}' mag maar één keer voorkomen.` };
    }
  }

  const zoekterm = zoekparameters.get("zoek")?.trim() ?? "";
  const dagen = zoekparameters.get("dagen")?.trim() ?? "";
  const specialeStatus = zoekparameters.get("specialeStatus")?.trim() ?? "";

  if (zoekterm.length > 100) {
    return { fout: "Queryparameter 'zoek' mag maximaal 100 tekens bevatten." };
  }
  if (!valideerDagen(dagen)) {
    return { fout: "Ongeldig aantal dagen." };
  }
  if (!valideerSpecialeStatus(specialeStatus)) {
    return { fout: "Ongeldige speciale status." };
  }

  return { zoekterm, dagen, specialeStatus };
}

export async function handleIndex(request) {
  const filters = leesVerkoperFilters(request);

  if (filters.fout) {
    return Response.json({ error: filters.fout }, { status: 400 });
  }

  try {
    const verkopers = await findAll({
      zoekterm: filters.zoekterm,
      dagen: filters.dagen,
      specialeStatus: filters.specialeStatus,
    });
    return Response.json(verkopers);
  } catch (fout) {
    console.error("Verkopers ophalen mislukt:", fout);
    return Response.json(
      { error: "Verkopers konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function handleShow(id) {
  try {
    const verkoper = await findById(id);
    if (!verkoper) {
      return Response.json({ error: "Verkoper niet gevonden." }, { status: 404 });
    }
    return Response.json(verkoper);
  } catch (fout) {
    console.error("Verkoper ophalen mislukt:", fout);
    return Response.json(
      { error: "Verkoper kon niet worden opgehaald." },
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

  const { gegevens, fouten } = valideerNieuweVerkoper(invoer);
  if (Object.keys(fouten).length) {
    return Response.json(
      { error: "Controleer de ingevulde gegevens.", fouten },
      { status: 400 }
    );
  }

  try {
    const resultaat = await create(gegevens);
    return Response.json(resultaat, { status: 201 });
  } catch (fout) {
    console.error("Verkoper toevoegen mislukt:", fout);
    return Response.json(
      { error: "De verkoper kon niet worden toegevoegd. Probeer opnieuw." },
      { status: 500 }
    );
  }
}

export async function handleKoppelContactpersoon(verkoperId, request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Ongeldig JSON lichaam." }, { status: 400 });
    }

    const contactpersoonId = Number(body.contactpersoonId);

    if (isNaN(contactpersoonId) || contactpersoonId <= 0) {
        return Response.json(
            { error: "Selecteer een contactpersoon om te koppelen." },
            { status: 400 },
        );
    }

    try {
        await koppelContactpersoon(verkoperId, contactpersoonId);
        return Response.json(
            { message: "Contactpersoon succesvol gekoppeld" },
            { status: 201 },
        );
    } catch (fout) {
        console.error("Koppelen contactpersoon mislukt:", fout);

        // Controleer op unique constraint fout
        if (fout.message && fout.message.includes("UNIQUE constraint failed")) {
            return Response.json(
                { error: "Deze contactpersoon is al gekoppeld aan deze verkoper." },
                { status: 409 },
            );
        }

        if (fout.message === 'Verkoper niet gevonden') {
            return Response.json({ error: "Verkoper niet gevonden." }, { status: 404 });
        }

        if (fout.message === 'Contactpersoon niet gevonden') {
            return Response.json({ error: "Contactpersoon niet gevonden." }, { status: 404 });
        }

        return Response.json(
            { error: "Koppelen is mislukt." },
            { status: 500 },
        );
    }
}
