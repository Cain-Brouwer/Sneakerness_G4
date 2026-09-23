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
