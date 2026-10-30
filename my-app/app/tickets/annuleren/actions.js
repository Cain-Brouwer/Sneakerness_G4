"use server";

import { revalidatePath } from "next/cache";
import { handleCancel } from "../../controllers/tickets.controller.js";

// Server Action: wordt aangeroepen als de bezoeker op "Bevestigen" klikt.
// Het id van het ticket komt als eerste argument binnen (via .bind in het formulier).
// Het annuleren zelf gebeurt in de controller; de action geeft alleen het resultaat door.
export async function annuleerTicket(id, previousState) {
  const resultaat = await handleCancel(id);

  // Na een succesvolle annulering moet het overzicht de nieuwe status laten zien.
  if (resultaat.status === "success") {
    revalidatePath("/tickets");
  }

  return resultaat;
}