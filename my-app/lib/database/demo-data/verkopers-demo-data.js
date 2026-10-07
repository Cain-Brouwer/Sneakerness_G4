import { voerQueryUit } from "../db.js";

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

export async function voegVerkoperDemoDataToe(database) {
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
}