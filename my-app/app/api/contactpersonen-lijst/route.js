import { handleIndex } from "../../controllers/contactpersonen.controller.js";

export async function GET() {
    return handleIndex();
}
