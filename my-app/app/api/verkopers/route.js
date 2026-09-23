import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
} from "../../lib/database.js";

const geldigeVerkopertypes = new Set(["sneakersverkoper", "side-stand"]);
const toegestaneParameters = new Set(["zoek", "type"]);

function valideerVerkopertype(verkopertype) {
  return verkopertype === "" || geldigeVerkopertypes.has(verkopertype);
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
  const typeVerkoper = zoekparameters.get("type")?.trim() ?? "";

  if (zoekterm.length > 100) {
    return { fout: "Queryparameter 'zoek' mag maximaal 100 tekens bevatten." };
  }

  if (!valideerVerkopertype(typeVerkoper)) {
    return { fout: "Ongeldig type verkoper." };
  }

  return { zoekterm, typeVerkoper };
}

function ontsnapZoekterm(zoekterm) {
  return zoekterm
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

async function haalVerkopersOp(zoekterm, typeVerkoper) {
  const database = await initialiseerDatabase();

  try {
    const voorwaarden = [];
    const parameters = [];

    if (zoekterm) {
      const zoekwaarde = `%${ontsnapZoekterm(zoekterm)}%`;

      // Zoekt op bedrijfsnaam, contactpersoon en e-mail.
      voorwaarden.push(`(
        Bedrijfsnaam LIKE ? ESCAPE '\\' COLLATE NOCASE OR
        Contactpersoon LIKE ? ESCAPE '\\' COLLATE NOCASE OR
        Email LIKE ? ESCAPE '\\' COLLATE NOCASE
      )`);
      parameters.push(zoekwaarde, zoekwaarde, zoekwaarde);
    }

    if (typeVerkoper) {
      voorwaarden.push("Verkopertype = ?");
      parameters.push(typeVerkoper);
    }

    const where = voorwaarden.length > 0
      ? `WHERE ${voorwaarden.join(" AND ")}`
      : "";

    return await haalRijenOp(
      database,
      `SELECT
         Id AS id,
         Bedrijfsnaam AS bedrijfsnaam,
         Contactpersoon AS contactpersoon,
         Email AS email,
         Telefoon AS telefoon,
         Verkopertype AS type_verkoper
       FROM Verkoper
       ${where}
       ORDER BY Bedrijfsnaam COLLATE NOCASE, Id`,
      parameters,
    );
  } finally {
    await sluitDatabase(database);
  }
}

export async function GET(request) {
  const zoekopdracht = leesVerkoperFilters(request);

  if (zoekopdracht.fout) {
    return Response.json({ error: zoekopdracht.fout }, { status: 400 });
  }

  try {
    const verkopers = await haalVerkopersOp(
      zoekopdracht.zoekterm,
      zoekopdracht.typeVerkoper,
    );

    return Response.json(verkopers);
  } catch (fout) {
    console.error("Verkopers ophalen mislukt:", fout);
    return Response.json(
      { error: "Verkopers konden niet worden opgehaald." },
      { status: 500 },
    );
  }
}
