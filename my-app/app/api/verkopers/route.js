import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
  voegVerkoperToe,
} from "../../../lib/database/db.js";
import { valideerNieuweVerkoper } from "../../lib/verkoper-validatie.js";

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

function ontsnapZoekterm(zoekterm) {
  return zoekterm
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

async function haalVerkopersOp(filters) {
  const database = await initialiseerDatabase();

  try {
    const voorwaarden = [];
    const parameters = [];

    if (filters.zoekterm) {
      const zoekwaarde = `%${ontsnapZoekterm(filters.zoekterm)}%`;

      // Zoekt op naam en verkoopsoort.
      voorwaarden.push(`(
        Naam LIKE ? ESCAPE '\\' COLLATE NOCASE OR
        VerkooptSoort LIKE ? ESCAPE '\\' COLLATE NOCASE
      )`);
      parameters.push(zoekwaarde, zoekwaarde);
    }

    if (filters.dagen) {
      voorwaarden.push("Dagen = ?");
      parameters.push(Number(filters.dagen));
    }

    if (filters.specialeStatus) {
      voorwaarden.push("SpecialeStatus = ?");
      parameters.push(filters.specialeStatus === "true" ? 1 : 0);
    }

    const where = voorwaarden.length > 0
      ? `WHERE ${voorwaarden.join(" AND ")}`
      : "";

    const rijen = await haalRijenOp(
      database,
      `SELECT
         v.Id AS id,
         v.Naam AS naam,
         v.SpecialeStatus AS specialeStatus,
         v.VerkooptSoort AS verkooptSoort,
         v.Dagen AS dagen,
         v.Logo AS logo,
         c.id AS contactId,
         c.Naam AS contactNaam
       FROM Verkoper v
       LEFT JOIN verkoper_contactpersoon vc ON v.Id = vc.VerkoperId
       LEFT JOIN contactpersonen c ON c.id = vc.ContactpersoonId
       ${where}
       ORDER BY v.Naam COLLATE NOCASE, v.Id, c.Naam COLLATE NOCASE`,
      parameters,
    );

    // Groepeer rijen per verkoper en verzamel gekoppelde contactpersonen
    const verkoperMap = new Map();
    for (const rij of rijen) {
      if (!verkoperMap.has(rij.id)) {
        verkoperMap.set(rij.id, {
          id: rij.id,
          naam: rij.naam,
          specialeStatus: Boolean(rij.specialeStatus),
          verkooptSoort: rij.verkooptSoort,
          dagen: rij.dagen,
          logo: rij.logo,
          contactpersonen: [],
        });
      }
      if (rij.contactId) {
        verkoperMap.get(rij.id).contactpersonen.push({
          id: rij.contactId,
          naam: rij.contactNaam,
        });
      }
    }

    return Array.from(verkoperMap.values());
  } finally {
    await sluitDatabase(database);
  }
}

export async function GET(request) {
  const filters = leesVerkoperFilters(request);

  if (filters.fout) {
    return Response.json({ error: filters.fout }, { status: 400 });
  }

  try {
    const verkopers = await haalVerkopersOp(filters);
    return Response.json(verkopers);
  } catch (fout) {
    console.error("Verkopers ophalen mislukt:", fout);
    return Response.json(
      { error: "Verkopers konden niet worden opgehaald." },
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
  const { gegevens, fouten } = valideerNieuweVerkoper(invoer);
  if (Object.keys(fouten).length) {
    return Response.json({ error: "Controleer de ingevulde gegevens.", fouten }, { status: 400 });
  }
  try {
    const resultaat = await voegVerkoperToe(gegevens);
    return Response.json(resultaat, { status: 201 });
  } catch (fout) {
    console.error("Verkoper toevoegen mislukt:", fout);
    return Response.json({ error: "De verkoper kon niet worden toegevoegd. Probeer opnieuw." }, { status: 500 });
  }
}
