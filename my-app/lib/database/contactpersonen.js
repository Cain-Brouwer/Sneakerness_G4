import { voerQueryUit } from "./db.js";

// Voegt een nieuwe contactpersoon toe aan de database.
export function voegContactpersoonToe(database, naam, telefoonnummer, email, isActief, opmerking) {
    return voerQueryUit(database, `
        INSERT INTO contactpersonen (Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
        VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now'))
    `, [naam, telefoonnummer, email, isActief, opmerking]);
}

// Verwijdert een contactpersoon en de koppelingen naar verkopers.
export async function verwijderContactpersoon(database, id) {
    await voerQueryUit(database, `
        DELETE FROM verkoper_contactpersoon WHERE ContactpersoonId = ?
    `, [id]);

    await voerQueryUit(database, `
        DELETE FROM Contactpersoonverkoper WHERE ContactpersoonId = ?
    `, [id]);

    return voerQueryUit(database, `
        DELETE FROM contactpersonen WHERE id = ?
    `, [id]);
}
