// Content source for the homepage: centralizes all static text used across the landing page.
// This keeps the page content easy to edit and ensures consistent event information everywhere.
export function getHomepageContent() {
  const content = {
    title: "Homepagina",
    eventName: "Sneakerness® Rotterdam",
    venue: "Van Nellefabriek",
    tagline: "Tweedaags sneaker-event",
    aboutTitle: "Over het event",
    aboutText:
      "Sneakerness Rotterdam is een tweedaags sneaker-event in de Van Nellefabriek. Bezoekers vinden releases, vintage pairs, customizers en community-stands onder één dak. Koop tickets of huur een stand en word onderdeel van het event.",
    ticketsTitle: "Tickets & Toegang",
    tickets: [
      {
        type: "Dagkaart",
        price: "€25",
        available: "Ja",
        access: "1 dag",
      },
      {
        type: "Weekendpas",
        price: "€40",
        available: "Ja",
        access: "2 dagen",
      },
      {
        type: "Early Entry",
        price: "€55",
        available: "Beperkt",
        access: "Vroege toegang",
      },
    ],
    stands: [
      { name: "AA+ Stand", description: "Premium locatie, grootste oppervlakte" },
      { name: "AA Stand", description: "Grote stand op een zichtbare plek" },
      { name: "A Stand", description: "Standaard stand voor verkopers" },
      { name: "Side-Stand", description: "Compacte stand langs de zijlijn" },
    ],
    footerInfo: "Locatie: Van Nellefabriek, Rotterdam. Tweedaags sneaker-event.",
    copyright: `© ${new Date().getFullYear()} Sneakerness Rotterdam. Alle rechten voorbehouden.`,
  };

  if (!content.eventName || !content.tickets?.length) {
    throw new Error("HOMEPAGE_LOAD_FAILED");
  }

  return content;
}
