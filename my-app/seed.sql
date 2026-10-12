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

CREATE TABLE IF NOT EXISTS verkoper_contactpersoon (
    id INTEGER PRIMARY KEY AUTOINCREMENT
    ,VerkoperId INTEGER NOT NULL
    ,ContactpersoonId INTEGER NOT NULL
    ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ,FOREIGN KEY (VerkoperId) REFERENCES Verkoper(Id)
    ,FOREIGN KEY (ContactpersoonId) REFERENCES contactpersonen(id)
    ,UNIQUE(VerkoperId, ContactpersoonId)
);

INSERT INTO Stand (Standnummer, Standtype)
SELECT 'A01', 'aa-plus'
WHERE NOT EXISTS (
    SELECT 1 FROM Stand WHERE Standnummer = 'A01'
);

INSERT INTO Stand (Standnummer, Standtype)
SELECT 'A02', 'aa'
WHERE NOT EXISTS (
    SELECT 1 FROM Stand WHERE Standnummer = 'A02'
);

INSERT INTO Stand (Standnummer, Standtype)
SELECT 'A03', 'a'
WHERE NOT EXISTS (
    SELECT 1 FROM Stand WHERE Standnummer = 'A03'
);

INSERT INTO Stand (Standnummer, Standtype)
SELECT 'B01', 'aa-plus'
WHERE NOT EXISTS (
    SELECT 1 FROM Stand WHERE Standnummer = 'B01'
);

INSERT INTO Stand (Standnummer, Standtype)
SELECT 'B02', 'aa'
WHERE NOT EXISTS (
    SELECT 1 FROM Stand WHERE Standnummer = 'B02'
);

INSERT INTO Stand (Standnummer, Standtype)
SELECT 'S01', 'side-stand'
WHERE NOT EXISTS (
    SELECT 1 FROM Stand WHERE Standnummer = 'S01'
);

INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
SELECT 'Sneaker District', 1, 'Sneakers', 2, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Verkoper WHERE Naam = 'Sneaker District'
);

INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
SELECT 'Sole Society', 0, 'Sneakers', 1, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Verkoper WHERE Naam = 'Sole Society'
);

INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
SELECT 'Bite & Sip', 0, 'Eten en Drinken', 2, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Verkoper WHERE Naam = 'Bite & Sip'
);

INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
SELECT 'Mini Kicks', 1, 'Kids Corner', 1, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Verkoper WHERE Naam = 'Mini Kicks'
);

INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
SELECT 'Urban Threads', 0, 'Streetwear', 2, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Verkoper WHERE Naam = 'Urban Threads'
);

INSERT INTO Verkoper (Naam, SpecialeStatus, VerkooptSoort, Dagen, Logo)
SELECT 'Lace Lab', 1, 'Accessoires', 1, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM Verkoper WHERE Naam = 'Lace Lab'
);
