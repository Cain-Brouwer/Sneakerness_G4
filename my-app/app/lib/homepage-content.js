export function getHomepageContent() {
  return {
    title: "Sneakerness Rotterdam",
    eventName: "Sneakerness Rotterdam",
    venue: "Rotterdam Ahoy",
    tagline: "De grootste sneaker- en streetwearbeurs van Nederland.",
    aboutTitle: "Over het event",
    aboutText:
      "Sneakerness Rotterdam brengt samen streetwear, sneakers, exclusieve releases en een bruisende community in één unieke beurservaring. Van premium drops tot verborgen gems: iedereen vindt hier iets dat bij zijn stijl past.",
    ticketsTitle: "Tickets & toegang",
    tickets: [
      { type: "Early Bird", price: "€29,99", available: "Ja" },
      { type: "Standard", price: "€39,99", available: "Ja" },
      { type: "VIP", price: "€69,99", available: "Beperkt" },
    ],
    stands: [
      { name: "Sneaker Drops", description: "Exclusieve releases en limited-edition pairs voor echte collectors." },
      { name: "Streetwear Labels", description: "Topmerken, capsule drops en statement basics voor iedere stijl." },
      { name: "Vintage Finds", description: "Retro silhouettes, iconische modellen en unieke hidden gems." },
      { name: "Creator Corner", description: "Meet lokale makers, stylers en community-ervaringen in de echte hub." },
    ],
    footerInfo: "Rotterdam Ahoy • 14 maart 2026 • 10:00 - 18:00",
    copyright: "© 2026 Sneakerness Rotterdam. Alle rechten voorbehouden.",
  };
}
