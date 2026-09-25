import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./lib/database/sneakerness.sqlite3');

// Onthoud verbindingsfouten zodat checkDatabaseConnection ze kan melden.
let connectionError = null;
db.on('error', (error) => {
    connectionError = error;
});

export function checkDatabaseConnection() {
    return new Promise((resolve, reject) => {
        if (process.env.FORCE_DB_ERROR === '1') {
            reject(new Error('Geen verbinding met de database'));
            return;
        }

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
