import db, { databaseReady } from './db';

// Haalt alle tickettypes op uit de database (voor de dropdown).
export async function getTicketTypes() {
    await databaseReady;

    return new Promise((resolve, reject) => {
        db.all('SELECT id, Naam FROM tickettypes ORDER BY id', (error, rows) => {
            if (error) {
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
}

// Slaat een nieuw ticket op in de database en geeft het id van het nieuwe ticket terug.
export async function createTicket(ticket) {
    await databaseReady;

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO tickets
                (Ticketnaam, TickettypeId, Prijs, AantalBeschikbaar, Evenementdatum, Beschrijving, Datumaangemaakt, Datumgewijzigd)
             VALUES (?, ?, ?, ?, ?, ?, DATE('now'), DATE('now'))`,
            [
                ticket.ticketnaam,
                ticket.tickettypeId,
                ticket.prijs,
                ticket.aantalBeschikbaar,
                ticket.evenementdatum,
                ticket.beschrijving,
            ],
            function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

// Haalt alle tickets op voor het ticketoverzicht, inclusief de naam van het tickettype.
// Gesorteerd op datum en tijdslot; tickets zonder tijdslot (hele dag) komen per dag als laatste.
export async function getTicketOverview() {
    await databaseReady;

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT t.id,
                    t.Ticketnaam,
                    tt.Naam AS Tickettype,
                    t.Prijs,
                    t.AantalBeschikbaar,
                    t.Evenementdatum,
                    t.Tijdslot
             FROM tickets t
             JOIN tickettypes tt ON tt.id = t.TickettypeId
             ORDER BY t.Evenementdatum, t.Tijdslot IS NULL, t.Tijdslot, t.id`,
            (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}