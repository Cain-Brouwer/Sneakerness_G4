import { valideerNieuweStand } from "./stand-validatie.js";

export const meldingStandWijzigenSucces = "De wijzigingen zijn succesvol opgeslagen.";
export const meldingStandWijzigenFout = "Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.";

export function valideerStandWijziging(invoer) {
  // Hergebruikt dezelfde tekst-, oppervlakte- en prijsvalidatie als toevoegen.
  const { gegevens: basis, fouten } = valideerNieuweStand({
    standnummer: invoer?.standnummer, locatie: invoer?.locatie,
    grootte: invoer?.grootte, prijs: invoer?.prijs,
    standtype: "a", status: "Beschikbaar",
  });
  const gegevens = { standnummer: basis.standnummer, locatie: basis.locatie, grootte: basis.grootte, prijsCenten: basis.prijsCenten };
  for (const veld of ["verkoperId", "verwachteVerkoperId"]) {
    gegevens[veld] = invoer?.[veld];
    if (gegevens[veld] !== null && (!Number.isSafeInteger(gegevens[veld]) || gegevens[veld] <= 0)) {
      fouten[veld] = veld === "verkoperId" ? "Kies een geldige verkoper of geen verkoper." : "Laad de stand opnieuw voordat je opslaat.";
    }
  }
  return { gegevens, fouten };
}
