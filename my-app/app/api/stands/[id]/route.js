import { handleStandWijziggegevens, handleWijzigStand } from "../../../controllers/stands.controller.js";

export async function GET(request, { params }) {
  const { id } = await params;
  return handleStandWijziggegevens(id);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  return handleWijzigStand(id, request);
}
