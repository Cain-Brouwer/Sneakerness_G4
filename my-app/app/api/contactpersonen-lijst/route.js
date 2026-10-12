import {
    haalRijenOp,
    initialiseerDatabase,
    sluitDatabase,
} from "../../../lib/database/db.js";

export async function GET() {
    const database = await initialiseerDatabase();

    try {
        const contactpersonen = await haalRijenOp(
            database,
            "SELECT id, Naam, Telefoonnummer, Email FROM contactpersonen ORDER BY Naam COLLATE NOCASE",
        );

        return Response.json(contactpersonen);
    } catch (fout) {
        console.error("Contactpersonen ophalen mislukt:", fout);
        return Response.json(
            { error: "Contactpersonen konden niet worden opgehaald." },
            { status: 500 },
        );
    } finally {
        await sluitDatabase(database);
    }
}
