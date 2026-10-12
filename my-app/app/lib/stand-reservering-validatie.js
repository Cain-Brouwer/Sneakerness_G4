export function valideerStandReservering(invoer) {
  const gegevens = {};
  const fouten = {};
  for (const [veld, label] of [["verkoperId", "verkoper"], ["standId", "stand"]]) {
    gegevens[veld] = invoer?.[veld];
    if (!Number.isSafeInteger(gegevens[veld]) || gegevens[veld] <= 0) fouten[veld] = `Kies een geldige ${label}.`;
  }
  for (const veld of ["evenementdatum", "startdatum", "einddatum"]) {
    const waarde = invoer?.[veld];
    gegevens[veld] = waarde;
    // Controleert ook onmogelijke kalenderdatums, zoals 30 februari.
    if (typeof waarde !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(waarde)
      || waarde.startsWith("0000") || !Number.isFinite(Date.parse(`${waarde}T00:00:00Z`))
      || new Date(`${waarde}T00:00:00Z`).toISOString().slice(0, 10) !== waarde) {
      fouten[veld] = "Vul een geldige datum in.";
    }
  }
  if (!fouten.startdatum && !fouten.einddatum && gegevens.einddatum < gegevens.startdatum) {
    fouten.einddatum = "De einddatum mag niet vóór de startdatum liggen.";
  }
  const opmerking = invoer?.opmerking;
  gegevens.opmerking = typeof opmerking === "string" ? opmerking.trim() : "";
  if ((opmerking !== undefined && typeof opmerking !== "string") || gegevens.opmerking.length > 2000) {
    fouten.opmerking = "Gebruik tekst van maximaal 2000 tekens.";
  }
  return { gegevens, fouten };
}
