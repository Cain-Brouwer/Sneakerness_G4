import { voerQueryUit } from "./db.js";

export async function voegDemoDataToe(database) {
  const sql = `
    INSERT OR IGNORE INTO contactpersonen
      (id, Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
    VALUES
      (1, 'Daan de Vries', '06-12345678', 'daan.devries@example.com', 1, 'Vaste contactpersoon voor Sneakerness.', DATE('now'), DATE('now')),
      (2, 'Lisa Jansen', '06-87654321', 'lisa.jansen@example.com', 1, 'Contactpersoon voor voorraad en bestellingen.', DATE('now'), DATE('now'));
  `;

  return voerQueryUit(database, sql);
}