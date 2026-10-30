"use server";

import { revalidatePath } from "next/cache";
import { handleUpdate } from "../../controllers/tickets.controller.js";

// Server Action: wordt aangeroepen als de organisator op "Wijzigingen opslaan" klikt.
// Het id van het ticket komt als eerste argument binnen (via .bind in het formulier).
// De action leest alleen het formulier uit; validatie en opslaan gebeuren in de controller.
export async function wijzigTicket(id, previousState, formData) {
  const values = {
    ticketnaam: String(formData.get("ticketnaam") ?? "").trim(),
    tickettypeId: String(formData.get("tickettypeId") ?? "").trim(),
    prijs: String(formData.get("prijs") ?? "").trim(),
    aantalBeschikbaar: String(formData.get("aantalBeschikbaar") ?? "").trim(),
    evenementdatum: String(formData.get("evenementdatum") ?? "").trim(),
    beschrijving: String(formData.get("beschrijving") ?? "").trim(),
  };

  const resultaat = await handleUpdate(id, values);

  // Na een succesvolle wijziging moet het overzicht de nieuwe gegevens laten zien.
  if (resultaat.status === "success") {
    revalidatePath("/tickets");
  }

  return resultaat;
}