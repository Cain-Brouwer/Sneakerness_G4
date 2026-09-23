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
