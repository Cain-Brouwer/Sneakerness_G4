import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./lib/database/sneakerness.sqlite3');

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

// ===================== NIEUW (begin): tickets =====================
// Maakt de tabellen voor tickets aan (als ze nog niet bestaan) en vult de tickettypes.
// Pagina's en queries wachten op deze promise, zodat de tabellen zeker bestaan.
export const databaseReady = new Promise((resolve, reject) => {
    db.exec(`
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
            Beschrijving TEXT,
            Datumaangemaakt DATE,
            Datumgewijzigd DATE,
            FOREIGN KEY (TickettypeId) REFERENCES tickettypes (id)
        );

        INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (1, 'Dagkaart');
        INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (2, 'Weekendpas');
        INSERT OR IGNORE INTO tickettypes (id, Naam) VALUES (3, 'Early Entry');
    `, (error) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
});
// Voorkomt een "unhandled rejection" als niemand de promise (nog) afwacht.
databaseReady.catch(() => {});
// ===================== NIEUW (einde): tickets =====================

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