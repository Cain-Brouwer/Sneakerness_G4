import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./lib/database/sneakerness.sqlite3');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS contactpersonen " +
        "(id INTEGER PRIMARY KEY, Naam TEXT, Telefoonnummer TEXT, Email TEXT, IsActief BIT, Opmerking TEXT, Datumaangemaakt DATE, Datumgewijzigd DATE)");
});

export default db;