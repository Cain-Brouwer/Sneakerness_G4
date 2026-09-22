import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
} from "../../lib/database.js";

const toegestaneTypes = new Set(["sneakersverkoper", "side-stand"]);
const toegestaneParameters = new Set(["zoek", "type"]);

function leesZoekparameters(request) {
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

  if (typeVerkoper && !toegestaneTypes.has(typeVerkoper)) {
    return { fout: "Ongeldig type verkoper." };
  }

  return { zoekterm, typeVerkoper };
}

function ontsnapZoekterm(zoekterm) {
  return zoekterm.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

async function haalVerkopersOp(zoekterm, typeVerkoper) {
  const database = await initialiseerDatabase();

  try {
    const voorwaarden = [];
    const parameters = [];

    if (zoekterm) {
      const zoekwaarde = `%${ontsnapZoekterm(zoekterm)}%`;

      // Zoekt zonder hoofdlettergevoeligheid in de drie afgesproken velden.
      voorwaarden.push(`(
        bedrijfsnaam LIKE ? ESCAPE '\\' COLLATE NOCASE OR
        contactpersoon LIKE ? ESCAPE '\\' COLLATE NOCASE OR
        email LIKE ? ESCAPE '\\' COLLATE NOCASE
      )`);
      parameters.push(zoekwaarde, zoekwaarde, zoekwaarde);
    }

    if (typeVerkoper) {
      voorwaarden.push("type_verkoper = ?");
      parameters.push(typeVerkoper);
    }

    const where = voorwaarden.length > 0
      ? `WHERE ${voorwaarden.join(" AND ")}`
      : "";

    return await haalRijenOp(
      database,
      `SELECT id, bedrijfsnaam, contactpersoon, email, telefoon, type_verkoper
       FROM verkopers
       ${where}
       ORDER BY bedrijfsnaam COLLATE NOCASE, id`,
      parameters,
    );
  } finally {
    await sluitDatabase(database);
  }
}

export async function GET(request) {
  const zoekopdracht = leesZoekparameters(request);

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
