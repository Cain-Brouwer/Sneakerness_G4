import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const dbPath = path.join(process.cwd(), 'app', 'lib', 'database', 'sneakerness.sqlite3');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

// Onthoud verbindingsfouten zodat checkDatabaseConnection ze kan melden.
let connectionError = null;
db.on('error', (error) => {
    connectionError = error;
});

export function checkDatabaseConnection() {
    return new Promise((resolve, reject) => {
        if (connectionError) {
            reject(new Error('Geen verbinding met de database'));
            return;
        }

        db.get('SELECT 1 AS ok', (error) => {
            if (error) {
                connectionError = error;
                reject(new Error('Geen verbinding met de database'));
            } else {
                resolve();
            }
        });
    });
}

// ===================== tickets =====================
// Kleine hulpfuncties om sqlite3 met async/await te kunnen gebruiken.
function exec(sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (error) => (error ? reject(error) : resolve()));
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (error) => (error ? reject(error) : resolve()));
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
    });
}

// Demo-tickets voor het ticketoverzicht (alleen gebruikt als ze nog niet in de database staan).
// Formaat: [ticketnaam, tickettypeId, prijs, aantalBeschikbaar, evenementdatum, tijdslot]
const DEMO_TICKETS = [
    // Zaterdag
    ['Dagkaart 11:00', 1, 25, 48, '2026-10-10', '11:00'],
    ['Dagkaart 12:00', 1, 25, 12, '2026-10-10', '12:00'],
    ['Dagkaart 14:00', 1, 30, 0, '2026-10-10', '14:00'],
    ['Dagkaart 16:00', 1, 25, 32, '2026-10-10', '16:00'],
    // Zondag
    ['Dagkaart 11:00', 1, 25, 48, '2026-10-11', '11:00'],
    ['Dagkaart 12:00', 1, 25, 32, '2026-10-11', '12:00'],
    ['Dagkaart 14:00', 1, 25, 15, '2026-10-11', '14:00'],
    ['Dagkaart 16:00', 1, 25, 0, '2026-10-11', '16:00'],
];

async function setupTickets() {
    await exec(`
        CREATE TABLE IF NOT EXISTS tickettypes (
            id INTEGER PRIMARY KEY,
            Naam TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Ticketnaam TEXT NOT NULL,
            TickettypeId INTEGER NOT NULL,
            Prijs REAL NOT NULL,
            AantalBeschikbaar INTEGER NOT NULL,
            Evenementdatum DATE NOT NULL,
            Tijdslot TEXT,
            Beschrijving TEXT,
            Datumaangemaakt DATE,
            Datumgewijzigd DATE,
            FOREIGN KEY (TickettypeId) REFERENCES tickettypes (id)
        );

        INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (1, 'Dagkaart');
        INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (2, 'Weekendpas');
        INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (3, 'Early Entry');
    `);

    // Een database uit een oudere versie heeft nog geen kolom "Tijdslot": voeg die toe.
    const kolommen = await all('PRAGMA table_info(tickets)');
    if (!kolommen.some((kolom) => kolom.name.toLowerCase() === 'tijdslot')) {
        try {
            await run('ALTER TABLE tickets ADD COLUMN Tijdslot TEXT');
        } catch (error) {
            // Een andere verbinding was ons net voor: dat is prima.
            if (!String(error.message).includes('duplicate column')) throw error;
        }
    }

    // Demo-tickets toevoegen als ze er nog niet zijn (per ticket, dus nooit dubbel).
    for (const [naam, typeId, prijs, aantal, datum, tijdslot] of DEMO_TICKETS) {
        await run(
            `INSERT INTO tickets
                (Ticketnaam, TickettypeId, Prijs, AantalBeschikbaar, Evenementdatum, Tijdslot, Datumaangemaakt, Datumgewijzigd)
             SELECT ?, ?, ?, ?, ?, ?, DATE('now'), DATE('now')
             WHERE NOT EXISTS (
                 SELECT 1 FROM tickets WHERE Ticketnaam = ? AND Evenementdatum = ? AND Tijdslot = ?
             )`,
            [naam, typeId, prijs, aantal, datum, tijdslot, naam, datum, tijdslot]
        );
    }
}

// Pagina's en queries wachten op deze promise, zodat de tabellen zeker bestaan.
export const databaseReady = setupTickets();
// Voorkomt een "unhandled rejection" als niemand de promise (nog) afwacht.
databaseReady.catch(() => {});
// ===================== tickets (einde) =====================

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS contactpersonen " +
        "(id INTEGER PRIMARY KEY, Naam TEXT, Telefoonnummer TEXT, Email TEXT, IsActief BIT, Opmerking TEXT, Datumaangemaakt DATE, Datumgewijzigd DATE)");

    // Voeg kolommen toe wanneer de database nog uit een oudere versie komt.
    const kolommen = [
        ['Naam', 'TEXT'],
        ['Telefoonnummer', 'TEXT'],
        ['Email', 'TEXT'],
        ['IsActief', 'BIT'],
        ['Opmerking', 'TEXT'],
        ['Datumaangemaakt', 'DATE'],
        ['Datumgewijzigd', 'DATE']
    ];

    db.all("PRAGMA table_info(contactpersonen)", (error, bestaandeKolommen) => {
        if (error) throw error;

        const namen = bestaandeKolommen.map((kolom) => kolom.name.toLowerCase());
        kolommen.forEach(([naam, type]) => {
            if (!namen.includes(naam.toLowerCase())) {
                db.run(`ALTER TABLE contactpersonen ADD COLUMN ${naam} ${type}`);
            }
        });

        db.run(`INSERT OR IGNORE INTO contactpersonen
            (id, Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
            VALUES
            (1, 'Daan de Vries', '06-12345678', 'daan.devries@example.com', 1, 'Vaste contactpersoon voor Sneakerness.', DATE('now'), DATE('now'))`);

        db.run(`INSERT OR IGNORE INTO contactpersonen
            (id, Naam, Telefoonnummer, Email, IsActief, Opmerking, Datumaangemaakt, Datumgewijzigd)
            VALUES
            (2, 'Lisa Jansen', '06-87654321', 'lisa.jansen@example.com', 1, 'Contactpersoon voor voorraad en bestellingen.', DATE('now'), DATE('now'))`);
    });
});

export default db;