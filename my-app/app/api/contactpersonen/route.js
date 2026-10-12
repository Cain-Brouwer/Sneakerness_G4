import {voegContactpersoonToe} from "../../../lib/database/db.js";

export async function POST(request) {
    const { naam, telefoonnummer, email, isActief, opmerking } = await request.json();

    // Open de database
    const database = await initialiseerDatabase();

    try {
        // Voeg de contactpersoon toe aan de database
        const resultaat = await voegContactpersoonToe(database, naam, telefoonnummer, email, isActief, opmerking);

        return new Response(JSON.stringify({ id: resultaat.id }), { status: 201 });
    } catch (error) {
        console.error("Fout bij het toevoegen van contactpersoon:", error);
        return new Response(JSON.stringify({ error: "Fout bij het toevoegen van contactpersoon" }), { status: 500 });
    } finally {
        // Sluit de database
        await sluitDatabase(database);
    }
}
