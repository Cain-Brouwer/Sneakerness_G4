import { voerQueryUit } from "./db.js";

// Demo-standen voor de ontwikkelomgeving. De NOT EXISTS-guard maakt het
// idempotent: herhaald initialiseren levert geen dubbele standen op.
const demoStands = [
  ["A01", "aa-plus"],
  ["A02", "aa"],
  ["A03", "a"],
  ["B01", "aa-plus"],
  ["B02", "aa"],
  ["S01", "side-stand"],
];

// Demo-verkopers voor de ontwikkelomgeving. Verkoper.Naam is niet uniek, dus de
// NOT EXISTS-guard is nodig om dubbele verkopers bij herhaald initialiseren te
// voorkomen.
const demoVerkopers = [
  ["Sneaker District", 1, "Sneakers", 2, null],
  ["Sole Society", 0, "Sneakers", 1, null],
  ["Bite & Sip", 0, "Eten en Drinken", 2, null],
  ["Mini Kicks", 1, "Kids Corner", 1, null],
  ["Urban Threads", 0, "Streetwear", 2, null],
  ["Lace Lab", 1, "Accessoires", 1, null],
];

// Demo-contactpersonen voor de ontwikkelomgeving.
const demoContactpersonen = [
  [
    1,
    "Daan de Vries",
    "06-12345678",
    "daan.devries@example.com",
    1,
    "Vaste contactpersoon voor Sneakerness.",
  ],
  [
    2,
    "Lisa Jansen",
    "06-87654321",
    "lisa.jansen@example.com",
    1,
    "Contactpersoon voor voorraad en bestellingen.",
  ],
];

// Vult alle tabellen met demo-data.
export async function voegDemoDataToe(database) {
  for (const [standnummer, standtype] of demoStands) {
    await voerQueryUit(
      database,
      `INSERT INTO Stand (Standnummer, Standtype)
       SELECT ?, ?
       WHERE NOT EXISTS (
           SELECT 1 FROM Stand WHERE Standnummer = ?
       )`,
      [standnummer, standtype, standnummer],
    );
  }

  for (const [naam, specialeStatus, verkooptSoort, dagen, logo] of demoVerkopers) {
    await voerQueryUit(
      database,
      `INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
       SELECT ?, ?, ?, ?, ?
       WHERE NOT EXISTS (
           SELECT 1 FROM Verkoper WHERE Naam = ?
       )`,
      [naam, specialeStatus, verkooptSoort, dagen, logo, naam],
    );
  }

  for (const [id, naam, telefoonnummer, email, isActief, opmerking] of demoContactpersonen) {
    await voerQueryUit(
      database,
      `INSERT INTO contactpersonen
         (id, Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
       SELECT ?, ?, ?, ?, ?, ?, DATE('now'), DATE('now')
       WHERE NOT EXISTS (
           SELECT 1 FROM contactpersonen WHERE id = ?
       )`,
      [id, naam, telefoonnummer, email, isActief, opmerking, id],
    );
  }
}