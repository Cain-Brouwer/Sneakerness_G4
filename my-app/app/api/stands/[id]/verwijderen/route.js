import { handleVerwijderStand } from "../../../../controllers/stands.controller.js";

export async function DELETE(request, { params }) {
  const { id } = await params;
  return handleVerwijderStand(id, request);
}
