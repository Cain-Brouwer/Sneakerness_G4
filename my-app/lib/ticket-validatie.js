// Validatie voor het wijzigen van een ticket (PBI 372).
// Geeft per veld een foutmelding terug; een leeg object betekent dat alles correct is.
// De teksten zijn dezelfde als bij "Ticket toevoegen" en staan in het testplan.
export function valideerTicket(values, ticketTypes) {
  const errors = {};

  if (!values.ticketnaam) {
    errors.ticketnaam = "Vul een ticketnaam in.";
  } else if (values.ticketnaam.length > 100) {
    errors.ticketnaam = "De ticketnaam mag maximaal 100 tekens bevatten.";
  }

  // Het gekozen tickettype moet echt in de database bestaan.
  if (!values.tickettypeId) {
    errors.tickettypeId = "Kies een tickettype.";
  } else if (!ticketTypes.some((type) => String(type.id) === values.tickettypeId)) {
    errors.tickettypeId = "Kies een geldig tickettype.";
  }

  if (!values.prijs) {
    errors.prijs = "Vul een prijs in.";
  } else if (!/^\d+([.,]\d{1,2})?$/.test(values.prijs)) {
    errors.prijs = "Vul een geldige prijs in (bijvoorbeeld 25 of 25,50).";
  }

  if (!values.aantalBeschikbaar) {
    errors.aantalBeschikbaar = "Vul het aantal beschikbare tickets in.";
  } else if (!/^\d+$/.test(values.aantalBeschikbaar)) {
    errors.aantalBeschikbaar = "Vul een geheel getal van 0 of hoger in.";
  }

  if (!values.evenementdatum) {
    errors.evenementdatum = "Kies een evenementdatum.";
  } else {
    // Controleert of het echt een bestaande datum is (dus niet 2026-02-31).
    const datum = new Date(`${values.evenementdatum}T00:00:00Z`);
    const isGeldig =
      /^\d{4}-\d{2}-\d{2}$/.test(values.evenementdatum) &&
      !Number.isNaN(datum.getTime()) &&
      datum.toISOString().slice(0, 10) === values.evenementdatum;

    if (!isGeldig) {
      errors.evenementdatum = "Vul een geldige datum in.";
    }
  }

  if (values.beschrijving.length > 500) {
    errors.beschrijving = "De beschrijving mag maximaal 500 tekens bevatten.";
  }

  return errors;
}