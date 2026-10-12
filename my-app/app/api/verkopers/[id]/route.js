import { handleShow, handleKoppelContactpersoon } from "../../../controllers/verkopers.controller.js";

export async function GET(request, { params }) {
  const { id } = await params;
  return handleShow(id);
}

export async function POST(request, { params }) {
    const { id } = await params;
    const verkoperId = Number(id);

    if (isNaN(verkoperId) || verkoperId <= 0) {
        return Response.json({ error: "Ongeldig verkoper ID." }, { status: 400 });
    }

    return handleKoppelContactpersoon(verkoperId, request);
}
