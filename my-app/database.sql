CREATE TABLE IF NOT EXISTS Verkoper (
    Id INTEGER PRIMARY KEY AUTOINCREMENT
    ,Bedrijfsnaam TEXT NOT NULL
    ,Contactpersoon TEXT NOT NULL
    ,Email TEXT NOT NULL
    ,Telefoon TEXT NOT NULL
    ,Verkopertype TEXT NOT NULL
        CHECK (Verkopertype IN ('sneakersverkoper', 'side-stand'))
    ,Isactief INTEGER NOT NULL DEFAULT 1
        CHECK (Isactief IN (0, 1))
    ,Opmerking TEXT
    ,Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ,Datumgewijzigd TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
