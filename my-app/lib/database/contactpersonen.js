import { voerQueryUit } from "./db.js";

// Voegt een nieuwe contactpersoon toe aan de database.
export function voegContactpersoonToe(database, naam, telefoonnummer, email, isActief, opmerking) {
    return voerQueryUit(database, `
        INSERT INTO contactpersonen (Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
        VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now'))
    `, [naam, telefoonnummer, email, isActief, opmerking]);
}
