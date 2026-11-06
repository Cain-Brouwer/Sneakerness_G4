import { haalRijenOp, voerQueryUit } from "./db.js";

function voerDatabaseSqlUit(database, sql) {
  return new Promise((resolve, reject) => {
    database.exec(sql, (fout) => {
      if (fout) {
        reject(fout);
        return;
      }
      resolve();
    });
  });
}

async function schakelForeignKeysIn(database) {
  await voerDatabaseSqlUit(database, "PRAGMA foreign_keys = ON;");
}

async function initialiseerVerkoperTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS Verkoper (
        Id INTEGER PRIMARY KEY AUTOINCREMENT
        ,Naam TEXT NOT NULL
        ,SpecialeStatus INTEGER NOT NULL DEFAULT 0
            CHECK (SpecialeStatus IN (0, 1))
        ,VerkooptSoort TEXT NOT NULL
        ,Dagen INTEGER NOT NULL
            CHECK (Dagen IN (1, 2))
        ,Logo TEXT
        ,Isactief INTEGER NOT NULL DEFAULT 1
            CHECK (Isactief IN (0, 1))
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initialiseerStandTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS Stand (
        Id INTEGER PRIMARY KEY AUTOINCREMENT
        ,Standnummer TEXT NOT NULL UNIQUE
        ,Standtype TEXT NOT NULL
            CHECK (Standtype IN ('aa-plus', 'aa', 'a', 'side-stand'))
        ,Isactief INTEGER NOT NULL DEFAULT 1
            CHECK (Isactief IN (0, 1))
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initialiseerContactpersoonTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS contactpersonen (
        id INTEGER PRIMARY KEY
        ,Naam TEXT
        ,Telefoonnummer TEXT
        ,Email TEXT
        ,IsActief INTEGER
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT
        ,Datumgewijzigd TEXT
    );
  `);
}

async function initialiseerVerkoperContactpersoonTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS verkoper_contactpersoon (
        id INTEGER PRIMARY KEY AUTOINCREMENT
        ,VerkoperId INTEGER NOT NULL
        ,ContactpersoonId INTEGER NOT NULL
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,FOREIGN KEY (VerkoperId) REFERENCES Verkoper(Id)
        ,FOREIGN KEY (ContactpersoonId) REFERENCES contactpersonen(id)
        ,UNIQUE(VerkoperId, ContactpersoonId)
    );
  `);
}

async function initialiseerBevestigingTabel(database) {
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS bevestigingen (
        id INTEGER PRIMARY KEY AUTOINCREMENT
        ,BestellerNaam TEXT NOT NULL
        ,BestellerEmail TEXT NOT NULL
        ,AantalTickets INTEGER NOT NULL DEFAULT 1
        ,TicketType TEXT NOT NULL
        ,Prijs TEXT NOT NULL
        ,Status TEXT NOT NULL DEFAULT 'afgerond'
            CHECK (Status IN ('afgerond', 'fout'))
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initialiseerTicketTabellen(database) {
  await voerDatabaseSqlUit(
    database,
    `
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
  `
  );
}

// Voegt de kolom "Tijdslot" toe aan oudere databases (bijv. "11:00"; leeg = hele dag).
async function initialiseerTicketTijdslotSchema(database) {
  const kolommen = await haalRijenOp(database, "PRAGMA table_info(tickets)");

  if (kolommen.some((kolom) => kolom.name.toLowerCase() === "tijdslot")) return;

  try {
    await voerQueryUit(database, "ALTER TABLE tickets ADD COLUMN Tijdslot TEXT");
  } catch (fout) {
    // Een andere aanvraag kan de kolom inmiddels hebben toegevoegd.
    if (!fout.message.includes("duplicate column name:")) throw fout;
  }
}

// Voegt de kolom "Status" toe aan oudere databases (PBI 373 Ticket annuleren).
// Waarden: 'actief' (standaard), 'geannuleerd' of 'gebruikt'. Een ticket wordt dus nooit verwijderd.
async function initialiseerTicketStatusSchema(database) {
  const kolommen = await haalRijenOp(database, "PRAGMA table_info(tickets)");

  if (kolommen.some((kolom) => kolom.name.toLowerCase() === "status")) return;

  try {
    await voerQueryUit(
      database,
      `ALTER TABLE tickets ADD COLUMN Status TEXT NOT NULL DEFAULT 'actief'
         CHECK (Status IN ('actief', 'geannuleerd', 'gebruikt'))`,
    );
  } catch (fout) {
    // Een andere aanvraag kan de kolom inmiddels hebben toegevoegd.
    if (!fout.message.includes("duplicate column name:")) throw fout;
  }
}

async function initialiseerStandToevoegenSchema(database) {
  const kolommen = await haalRijenOp(database, "PRAGMA table_info(Stand)");
  const nieuweKolommen = [
    ["Locatie", "TEXT"],
    ["Grootte", "REAL CHECK (Grootte > 0)"],
    ["PrijsCenten", "INTEGER CHECK (PrijsCenten >= 0)"],
    ["Status", "TEXT NOT NULL DEFAULT 'Beschikbaar'"],
    ["VerkoperId", "INTEGER REFERENCES Verkoper(Id)"],
  ];
  for (const [naam, definitie] of nieuweKolommen) {
    if (kolommen.some((kolom) => kolom.name.toLowerCase() === naam.toLowerCase())) continue;
    try {
      await voerQueryUit(database, `ALTER TABLE Stand ADD COLUMN ${naam} ${definitie}`);
    } catch (fout) {
      // Een andere aanvraag kan dezelfde kolom inmiddels hebben toegevoegd.
      if (!fout.message.includes("duplicate column name:")) throw fout;
      const actueleKolommen = await haalRijenOp(database, "PRAGMA table_info(Stand)");
      if (!actueleKolommen.some((kolom) => kolom.name.toLowerCase() === naam.toLowerCase())) throw fout;
    }
  }
}

async function initialiseerStandReserveringTabel(database) {
  // De verkoperkoppeling en status blijven uitsluitend in Stand staan.
  await voerDatabaseSqlUit(database, `
    CREATE TABLE IF NOT EXISTS StandReservering (
        Id INTEGER PRIMARY KEY AUTOINCREMENT
        ,StandId INTEGER NOT NULL UNIQUE REFERENCES Stand(Id)
        ,Evenementdatum TEXT NOT NULL
        ,Startdatum TEXT NOT NULL
        ,Einddatum TEXT NOT NULL CHECK (Einddatum >= Startdatum)
        ,Opmerking TEXT
        ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initialiseerVerkoperToevoegenSchema(database) {
  const kolommen = await haalRijenOp(database, "PRAGMA table_info(Verkoper)");

  for (const naam of ["Adres", "Postcode", "Plaats"]) {
    if (!kolommen.some((kolom) => kolom.name.toLowerCase() === naam.toLowerCase())) {
      try {
        await voerQueryUit(database, `ALTER TABLE Verkoper ADD COLUMN ${naam} TEXT`);
      } catch (fout) {
        if (!fout.message.includes("duplicate column name:")) throw fout;
        const actueleKolommen = await haalRijenOp(database, "PRAGMA table_info(Verkoper)");
        if (!actueleKolommen.some((kolom) => kolom.name.toLowerCase() === naam.toLowerCase())) {
          throw fout;
        }
      }
    }
  }

  await voerDatabaseSqlUit(
    database,
    `
    CREATE TABLE IF NOT EXISTS Contactpersoonverkoper (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        VerkoperId INTEGER NOT NULL REFERENCES Verkoper(Id),
        ContactpersoonId INTEGER NOT NULL REFERENCES contactpersonen(id),
        UNIQUE (VerkoperId, ContactpersoonId)
    );
  `
  );
}

export async function initialiseerAlleTabellen(database) {
  await schakelForeignKeysIn(database);
  await initialiseerVerkoperTabel(database);
  await initialiseerStandTabel(database);
  await initialiseerStandToevoegenSchema(database);
  await initialiseerStandReserveringTabel(database);
  await initialiseerContactpersoonTabel(database);
  await initialiseerVerkoperContactpersoonTabel(database);
  await initialiseerBevestigingTabel(database);
  await initialiseerVerkoperToevoegenSchema(database);
  await initialiseerTicketTabellen(database);
  await initialiseerTicketTijdslotSchema(database);
  await initialiseerTicketStatusSchema(database);
}