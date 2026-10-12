import { voerQueryUit } from "./db.js";

export async function voegDemoDataToe(database) {
  // Voeg demo data toe aan contactpersonen tabel
  const sqlContactpersonen = `
    INSERT OR IGNORE INTO contactpersonen
      (id, Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
    VALUES
      (1, 'Daan de Vries', '06-12345678', 'daan.devries@example.com', 1, 'Vaste contactpersoon voor Sneakerness.', DATE('now'), DATE('now')),
      (2, 'Lisa Jansen', '06-87654321', 'lisa.jansen@example.com', 1, 'Contactpersoon voor voorraad en bestellingen.', DATE('now'), DATE('now'));
  `;

  await voerQueryUit(database, sqlContactpersonen);

  // Voeg demo data toe aan Stand tabel
  const sqlStand = `
    INSERT OR IGNORE INTO Stand (Standnummer, Standtype)
    VALUES
      ('A01', 'aa-plus'),
      ('A02', 'aa'),
      ('A03', 'a'),
      ('B01', 'aa-plus'),
      ('B02', 'aa'),
      ('S01', 'side-stand');
  `;

  await voerQueryUit(database, sqlStand);

  // Voeg demo data toe aan Verkoper tabel
  const sqlVerkoper = `
    INSERT OR IGNORE INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
    VALUES
      ('Sneaker District', 1, 'Sneakers', 2, NULL),
      ('Sole Society', 0, 'Sneakers', 1, NULL),
      ('Bite & Sip', 0, 'Eten en Drinken', 2, NULL),
      ('Mini Kicks', 1, 'Kids Corner', 1, NULL),
      ('Urban Threads', 0, 'Streetwear', 2, NULL),
      ('Lace Lab', 1, 'Accessoires', 1, NULL);
  `;

  return voerQueryUit(database, sqlVerkoper);
}