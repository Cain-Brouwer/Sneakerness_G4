import { voerQueryUit, haalRijenOp } from "./db.js";

// Maakt een bevestiging aan voor een ticketbestelling.
export function maakBevestigingAan(database, bestellerNaam, bestellerEmail, aantalTickets, ticketType, prijs, status) {
    return voerQueryUit(database, `
        INSERT INTO bevestigingen (BestellerNaam, BestellerEmail, AantalTickets, TicketType, Prijs, Status, Datumaangemaakt)
        VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))
    `, [bestellerNaam, bestellerEmail, aantalTickets, ticketType, prijs, status]);
}

// Haalt een bevestiging op basis van het id.
export function haalBevestigingOp(database, id) {
    return haalRijenOp(database, `
        SELECT id, BestellerNaam, BestellerEmail, AantalTickets, TicketType, Prijs, Status, Datumaangemaakt
        FROM bevestigingen
        WHERE id = ?
    `, [id]);
}
