import { handleIndex, handleCreate } from "../../controllers/verkopers.controller.js";

export async function GET(request) {
  return handleIndex(request);
}

export async function POST(request) {
  return handleCreate(request);
}
