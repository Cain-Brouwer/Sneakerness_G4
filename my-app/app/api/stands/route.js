import {
  haalStandRijenOp,
  initialiseerStandsDatabase,
  sluitStandsDatabase,
} from "../../lib/stands-database.js";
import { voegStandToe } from "../../../lib/database/db.js";
import { valideerNieuweStand } from "../../lib/stand-validatie.js";

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

function ontsnapZoekterm(zoekterm) {
  return zoekterm
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

async function haalStandsOp(zoekterm, standtype) {
  const database = await initialiseerStandsDatabase();

  try {
    const voorwaarden = [];
    const parameters = [];

    if (zoekterm) {
      // Zoekt zonder hoofdlettergevoeligheid op standnummer.
      voorwaarden.push("Standnummer LIKE ? ESCAPE '\\' COLLATE NOCASE");
      parameters.push(`%${ontsnapZoekterm(zoekterm)}%`);
    }

    if (standtype) {
      voorwaarden.push("Standtype = ?");
      parameters.push(standtype);
    }

    const where = voorwaarden.length > 0
      ? `WHERE ${voorwaarden.join(" AND ")}`
      : "";

    return await haalStandRijenOp(
      database,
      `SELECT Id AS id, Standnummer AS standnummer, Standtype AS standtype
       FROM Stand
       ${where}
       ORDER BY Standnummer COLLATE NOCASE, Id`,
      parameters,
    );
  } finally {
    await sluitStandsDatabase(database);
  }
}

export async function GET(request) {
  const filters = leesStandFilters(request);

  if (filters.fout) {
    return Response.json({ error: filters.fout }, { status: 400 });
  }

  try {
    const stands = await haalStandsOp(filters.zoekterm, filters.standtype);
    return Response.json(stands);
  } catch (fout) {
    console.error("Stands ophalen mislukt:", fout);
    return Response.json(
      { error: "Stands konden niet worden opgehaald." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  const { gegevens, fouten } = valideerNieuweStand(invoer);
  if (Object.keys(fouten).length) {
    return Response.json({ error: "Controleer de ingevulde gegevens.", fouten }, { status: 400 });
  }
  try {
    const resultaat = await voegStandToe(gegevens);
    return Response.json({ id: resultaat.id }, { status: 201 });
  } catch (fout) {
    if (fout.code === "SQLITE_CONSTRAINT" && fout.message.includes("Stand.Standnummer")) {
      return Response.json({ error: "Dit standnummer bestaat al.", fouten: { standnummer: "Kies een ander standnummer." } }, { status: 409 });
    }
    console.error("Stand toevoegen mislukt:", fout);
    return Response.json({ error: "De stand kon niet worden toegevoegd. Probeer opnieuw." }, { status: 500 });
  }
}
