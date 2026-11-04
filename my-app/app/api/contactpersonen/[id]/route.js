import { handleUpdate, handleShow, handleDelete } from "../../../controllers/contactpersonen.controller.js";

export async function GET(request, { params }) {
  const { id } = await params;
  return handleShow(id);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  return handleUpdate(id, request);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  return handleDelete(id);
}
