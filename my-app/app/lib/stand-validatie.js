export const standtypes = {
  "aa-plus": "AA+ Stand",
  aa: "AA Stand",
  a: "A Stand",
  "side-stand": "Side-Stand",
};

export function valideerNieuweStand(invoer) {
  const gegevens = {};
  const fouten = {};
  const tekstvelden = {
    standnummer: ["Standnummer", 50],
    locatie: ["Locatie / Hal", 150],
    status: ["Status", 50],
    opmerking: ["Opmerkingen", 2000],
  };
  for (const [veld, [label, maximum]] of Object.entries(tekstvelden)) {
    const waarde = invoer?.[veld];
    gegevens[veld] = typeof waarde === "string" ? waarde.trim() : "";
    if (waarde !== undefined && typeof waarde !== "string") fouten[veld] = `${label} moet tekst zijn.`;
    else if (!gegevens[veld] && veld !== "opmerking") fouten[veld] = `Vul ${label.toLowerCase()} in.`;
    else if (gegevens[veld].length > maximum) fouten[veld] = `${label} mag maximaal ${maximum} tekens bevatten.`;
  }
  gegevens.standtype = invoer?.standtype;
  if (typeof gegevens.standtype !== "string" || !Object.hasOwn(standtypes, gegevens.standtype)) fouten.standtype = "Kies een geldig standtype.";
  gegevens.grootte = invoer?.grootte;
  if (typeof gegevens.grootte !== "number" || !Number.isFinite(gegevens.grootte) || gegevens.grootte <= 0) {
    fouten.grootte = "Vul een geldige grootte groter dan 0 m² in.";
  }
  const prijs = invoer?.prijs;
  gegevens.prijsCenten = null;
  if (prijs !== undefined && prijs !== null && prijs !== "") {
    // Accepteert euro's met maximaal twee decimalen, inclusief een Nederlandse komma.
    const prijstekst = typeof prijs === "number" || typeof prijs === "string" ? String(prijs).replace(",", ".") : "";
    if (!/^\d+(\.\d{1,2})?$/.test(prijstekst) || !Number.isSafeInteger(Math.round(Number(prijstekst) * 100))) {
      fouten.prijs = "Vul een geldige prijs in met maximaal twee decimalen.";
    } else {
      gegevens.prijsCenten = Math.round(Number(prijstekst) * 100);
    }
  }
  return { gegevens, fouten };
}
