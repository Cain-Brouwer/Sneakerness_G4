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
