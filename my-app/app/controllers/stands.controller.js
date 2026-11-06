import { findAll, findById, create } from "../models/stand.js";
import { valideerNieuweStand } from "../../lib/stand-validatie.js";
import { wijzigStand, haalStandWijziggegevensOp } from "../models/stand.js";
import { valideerStandWijziging, meldingStandWijzigenSucces, meldingStandWijzigenFout } from "../../lib/stand-wijzigen-validatie.js";

function isGeldigStandId(id) {
  return /^[1-9]\d*$/.test(String(id)) && Number.isSafeInteger(Number(id));
}

export async function handleStandWijziggegevens(id) {
  if (!isGeldigStandId(id)) return Response.json({ error: "Ongeldig stand ID." }, { status: 400 });
  try {
    const gegevens = await haalStandWijziggegevensOp(Number(id));
    if (!gegevens) return Response.json({ error: "Stand niet gevonden." }, { status: 404 });
    return Response.json(gegevens);
  } catch (fout) {
    console.error("Standwijziggegevens ophalen mislukt:", fout);
    return Response.json({ error: "De standgegevens konden niet worden geladen." }, { status: 500 });
  }
}

export async function handleWijzigStand(id, request) {
  if (!isGeldigStandId(id)) return Response.json({ error: "Ongeldig stand ID." }, { status: 400 });
  let invoer;
  try { invoer = await request.json(); } catch { return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const { gegevens, fouten } = valideerStandWijziging(invoer);
  if (Object.keys(fouten).length) return Response.json({ error: "Controleer de ingevulde gegevens.", fouten }, { status: 400 });
  try {
    return Response.json({ ...await wijzigStand(Number(id), gegevens), message: meldingStandWijzigenSucces });
  } catch (fout) {
    if (fout.status === 400 || fout.status === 404 || fout.status === 409) return Response.json({ error: fout.message, ...(fout.fouten && { fouten: fout.fouten }) }, { status: fout.status });
    if (fout.code === "SQLITE_CONSTRAINT" && fout.message.includes("Stand.Standnummer")) {
      return Response.json({ error: "Dit standnummer bestaat al.", fouten: { standnummer: "Kies een ander standnummer." } }, { status: 409 });
    }
    console.error("Stand wijzigen mislukt:", fout);
    return Response.json({ error: meldingStandWijzigenFout }, { status: 500 });
  }
}

/**
 * Controller voor Stands API
 * Verwerkt requests voor stands endpoints
 */

const geldigeStandtypes = new Set(["aa-plus", "aa", "a", "side-stand"]);
const geldigeQueryparameters = new Set(["zoek", "type"]);

function valideerStandtype(standtype) {
  return standtype === "" || geldigeStandtypes.has(standtype);
}

function leesStandFilters(request) {
  const queryparameters = new URL(request.url).searchParams;

  for (const parameter of queryparameters.keys()) {
    if (!geldigeQueryparameters.has(parameter)) {
      return { fout: `Onbekende queryparameter: ${parameter}` };
    }
    if (queryparameters.getAll(parameter).length > 1) {
      return { fout: `Queryparameter '${parameter}' mag maar één keer voorkomen.` };
    }
  }

  const zoekterm = queryparameters.get("zoek")?.trim() ?? "";
  const standtype = queryparameters.get("type")?.trim() ?? "";

  if (zoekterm.length > 100) {
    return { fout: "Queryparameter 'zoek' mag maximaal 100 tekens bevatten." };
  }

  if (!valideerStandtype(standtype)) {
    return { fout: "Ongeldig type stand." };
  }

  return { zoekterm, standtype };
}

export async function handleIndex(request) {
  const filters = leesStandFilters(request);

  if (filters.fout) {
    return Response.json({ error: filters.fout }, { status: 400 });
  }

  try {
    const stands = await findAll({
      zoekterm: filters.zoekterm,
      standtype: filters.standtype,
    });
    return Response.json(stands);
  } catch (fout) {
    console.error("Stands ophalen mislukt:", fout);
    return Response.json(
      { error: "Stands konden niet worden opgehaald." },
      { status: 500 }
    );
  }
}

export async function handleShow(id) {
  try {
    const stand = await findById(id);
    if (!stand) {
      return Response.json({ error: "Stand niet gevonden." }, { status: 404 });
    }
    return Response.json(stand);
  } catch (fout) {
    console.error("Stand ophalen mislukt:", fout);
    return Response.json(
      { error: "Stand kon niet worden opgehaald." },
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

  const { gegevens, fouten } = valideerNieuweStand(invoer);
  if (Object.keys(fouten).length) {
    return Response.json(
      { error: "Controleer de ingevulde gegevens.", fouten },
      { status: 400 }
    );
  }

  try {
    const resultaat = await create(gegevens);
    return Response.json({ id: resultaat.id }, { status: 201 });
  } catch (fout) {
    if (fout.code === "SQLITE_CONSTRAINT" && fout.message.includes("Stand.Standnummer")) {
      return Response.json(
        {
          error: "Dit standnummer bestaat al.",
          fouten: { standnummer: "Kies een ander standnummer." },
        },
        { status: 409 }
      );
    }
    console.error("Stand toevoegen mislukt:", fout);
    return Response.json(
      { error: "De stand kon niet worden toegevoegd. Probeer opnieuw." },
      { status: 500 }
    );
  }
}
