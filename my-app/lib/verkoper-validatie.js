export function valideerNieuweVerkoper(invoer) {
  const fouten = {};
  const gegevens = {};
  const velden = {
    naam: ["Bedrijfsnaam", 150],
    contactpersoon: ["Contactpersoon", 150],
    email: ["E-mailadres", 254],
    adres: ["Adres", 200],
    postcode: ["Postcode", 20],
    plaats: ["Plaats", 100],
    verkooptSoort: ["Type verkoper", 100],
    telefoon: ["Telefoonnummer", 30],
    opmerking: ["Opmerkingen", 2000],
  };
  for (const [veld, [label, maximum]] of Object.entries(velden)) {
    const waarde = invoer?.[veld];
    gegevens[veld] = typeof waarde === "string" ? waarde.trim() : "";
    if (waarde !== undefined && typeof waarde !== "string") {
      fouten[veld] = `${label} moet tekst zijn.`;
    } else if (!gegevens[veld] && !["telefoon", "opmerking"].includes(veld)) {
      fouten[veld] = `Vul ${label.toLowerCase()} in.`;
    } else if (gegevens[veld].length > maximum) {
      fouten[veld] = `${label} mag maximaal ${maximum} tekens bevatten.`;
    }
  }
  if (gegevens.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gegevens.email)) {
    fouten.email = "Vul een geldig e-mailadres in.";
  }
  gegevens.dagen = invoer?.dagen;
  if (![1, 2].includes(gegevens.dagen)) {
    fouten.dagen = "Kies 1 dag of 2 dagen.";
  }
  return { gegevens, fouten };
}
