import { handleCreate } from "../../controllers/contactpersonen.controller.js";

export async function POST(request) {
    return handleCreate(request);
}
