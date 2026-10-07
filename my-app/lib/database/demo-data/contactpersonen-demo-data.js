import { voerQueryUit } from "../db.js";

// Demo-contactpersonen voor de ontwikkelomgeving. Vervangt de eerder inline
// ingevoegde rijen in initialiseerContactpersoonTabel.
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

export async function voegContactpersoonDemoDataToe(database) {
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