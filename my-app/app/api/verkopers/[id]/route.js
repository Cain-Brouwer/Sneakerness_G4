import {
    haalRijenOp,
    initialiseerDatabase,
    sluitDatabase,
} from "../../../../lib/database/db.js";
import {
    koppelenContactpersoonAanVerkoper,
    haalGekoppeldeContactpersonenOp,
} from "../../../../lib/database/verkopers.js";

async function haalVerkoperDetailsOp(verkoperId) {
    const database = await initialiseerDatabase();

    try {
        const verkoper = await haalRijenOp(
            database,
            `SELECT Id AS id, Naam AS naam, SpecialeStatus AS specialeStatus, VerkooptSoort AS verkooptSoort, Dagen AS dagen, Logo AS logo FROM Verkoper WHERE Id = ?`,
            [verkoperId],
        );

        if (verkoper.length === 0) {
            return null;
        }

        const gekoppeldeContactpersonen = await haalGekoppeldeContactpersonenOp(database, verkoperId);

        return {
            verkoper: {
                ...verkoper[0],
                specialeStatus: Boolean(verkoper[0].specialeStatus),
            },
            gekoppeldeContactpersonen,
        };
    } finally {
        await sluitDatabase(database);
    }
}

export async function GET(request, { params }) {
    const { id } = await params;
    const verkoperId = Number(id);

    if (isNaN(verkoperId) || verkoperId <= 0) {
        return Response.json({ error: "Ongeldig verkoper ID." }, { status: 400 });
    }

    try {
        const details = await haalVerkoperDetailsOp(verkoperId);

        if (details === null) {
            return Response.json({ error: "Verkoper niet gevonden." }, { status: 404 });
        }

        return Response.json(details);
    } catch (fout) {
        console.error("Verkoper details ophalen mislukt:", fout);
        return Response.json(
            { error: "Verkoper details konden niet worden opgehaald." },
            { status: 500 },
        );
    }
}

export async function POST(request, { params }) {
    const { id } = await params;
    const verkoperId = Number(id);

    if (isNaN(verkoperId) || verkoperId <= 0) {
        return Response.json({ error: "Ongeldig verkoper ID." }, { status: 400 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Ongeldig JSON lichaam." }, { status: 400 });
    }

    const contactpersoonId = Number(body.contactpersoonId);

    if (isNaN(contactpersoonId) || contactpersoonId <= 0) {
        return Response.json(
            { error: "Selecteer een contactpersoon om te koppelen." },
            { status: 400 },
        );
    }

    const database = await initialiseerDatabase();

    try {
        // Controleer of de verkoper bestaat
        const verkoper = await haalRijenOp(
            database,
            `SELECT Id FROM Verkoper WHERE Id = ?`,
            [verkoperId],
        );

        if (verkoper.length === 0) {
            return Response.json({ error: "Verkoper niet gevonden." }, { status: 404 });
        }

        // Controleer of de contactpersoon bestaat
        const contactpersoon = await haalRijenOp(
            database,
            `SELECT id FROM contactpersonen WHERE id = ?`,
            [contactpersoonId],
        );

        if (contactpersoon.length === 0) {
            return Response.json({ error: "Contactpersoon niet gevonden." }, { status: 404 });
        }

        // Koppel de contactpersoon aan de verkoper
        await koppelenContactpersoonAanVerkoper(database, verkoperId, contactpersoonId);

        return Response.json(
            { message: "Contactpersoon succesvol gekoppeld" },
            { status: 201 },
        );
    } catch (fout) {
        console.error("Koppelen contactpersoon mislukt:", fout);

        // Controleer op unique constraint fout
        if (fout.message && fout.message.includes("UNIQUE constraint failed")) {
            return Response.json(
                { error: "Deze contactpersoon is al gekoppeld aan deze verkoper." },
                { status: 409 },
            );
        }

        return Response.json(
            { error: "Koppelen is mislukt." },
            { status: 500 },
        );
    } finally {
        await sluitDatabase(database);
    }
}
