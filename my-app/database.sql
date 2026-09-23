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
