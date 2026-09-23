import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
} from "../../../lib/database/db.js";

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
         Id AS id,
         Naam AS naam,
         SpecialeStatus AS specialeStatus,
         VerkooptSoort AS verkooptSoort,
         Dagen AS dagen,
         Logo AS logo
       FROM Verkoper
       ${where}
       ORDER BY Naam COLLATE NOCASE, Id`,
      parameters,
    );

    return rijen.map((verkoper) => ({
      ...verkoper,
      specialeStatus: Boolean(verkoper.specialeStatus),
    }));
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
