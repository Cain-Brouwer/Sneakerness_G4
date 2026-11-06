export const meldingWijzigenSucces = "De wijzigingen zijn succesvol opgeslagen.";
export const meldingWijzigenFout = "Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.";

export function valideerVerkoperWijziging(invoer) {
  const gegevens = {};
  const fouten = {};
  for (const [veld, label, maximum] of [
    ["contactpersoon", "Naam", 150],
    ["email", "E-mailadres", 254],
    ["telefoon", "Telefoonnummer", 30],
    ["naam", "Bedrijfsnaam", 150],
    ["adres", "Adres", 200],
  ]) {
    const waarde = invoer?.[veld];
    gegevens[veld] = typeof waarde === "string" ? waarde.trim() : "";
    if (waarde !== undefined && typeof waarde !== "string") fouten[veld] = `${label} moet tekst zijn.`;
    else if (!gegevens[veld] && veld !== "telefoon") fouten[veld] = `Vul ${label.toLowerCase()} in.`;
    else if (gegevens[veld].length > maximum) fouten[veld] = `${label} mag maximaal ${maximum} tekens bevatten.`;
  }
  if (gegevens.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gegevens.email)) fouten.email = "Vul een geldig e-mailadres in.";
  gegevens.contactpersoonId = invoer?.contactpersoonId ?? null;
  if (gegevens.contactpersoonId !== null && (!Number.isSafeInteger(gegevens.contactpersoonId) || gegevens.contactpersoonId <= 0)) {
    fouten.contactpersoonId = "Kies een geldige gekoppelde contactpersoon.";
  }
  return { gegevens, fouten };
}
