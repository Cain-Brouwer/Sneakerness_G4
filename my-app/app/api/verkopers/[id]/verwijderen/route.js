import { handleVerwijderVerkoper } from "../../../../controllers/verkopers.controller.js";

export async function DELETE(request, { params }) {
  const { id } = await params;
  return handleVerwijderVerkoper(id, request);
}
