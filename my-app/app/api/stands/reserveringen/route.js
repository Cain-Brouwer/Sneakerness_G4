import { haalReserveringsgegevensOp, reserveerStand } from "../../../lib/stand-reserveringen-database.js";
import { valideerStandReservering } from "../../../lib/stand-reservering-validatie.js";

export async function GET() {
  try {
    return Response.json(await haalReserveringsgegevensOp());
  } catch (fout) {
    console.error("Reserveringsgegevens ophalen mislukt:", fout);
    return Response.json({ error: "De reserveringsgegevens konden niet worden geladen." }, { status: 500 });
  }
}

export async function POST(request) {
  let invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  const { gegevens, fouten } = valideerStandReservering(invoer);
  if (Object.keys(fouten).length) return Response.json({ error: "Controleer de ingevulde gegevens.", fouten }, { status: 400 });
  try {
    return Response.json(await reserveerStand(gegevens), { status: 201 });
  } catch (fout) {
    if (fout.status === 400 || fout.status === 409) return Response.json({ error: fout.message, fouten: fout.fouten }, { status: fout.status });
    console.error("Stand reserveren mislukt:", fout);
    return Response.json({ error: "De stand kon niet worden gereserveerd. Probeer opnieuw." }, { status: 500 });
  }
}
