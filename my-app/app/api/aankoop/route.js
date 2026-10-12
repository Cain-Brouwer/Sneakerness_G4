import {initialiseerDatabase, sluitDatabase, maakBevestigingAan} from "../../../lib/database/db.js";

export async function POST(request) {
    const { bestellerNaam, bestellerEmail, aantalTickets, ticketType, prijs, forceerFout } = await request.json();

    // Simuleer een fout als forceerFout true is
    if (forceerFout === true || forceerFout === "true") {
        throw new Error("Systeemfout bij het genereren van de bevestiging");
    }

    const database = await initialiseerDatabase();

    try {
        const resultaat = await maakBevestigingAan(
            database,
            bestellerNaam,
            bestellerEmail,
            aantalTickets,
            ticketType,
            prijs,
            'afgerond'
        );

        return new Response(JSON.stringify({
            succes: true,
            bevestigingId: resultaat.id,
            bericht: "Bevestiging succesvol aangemaakt"
        }), { status: 201 });
    } catch (error) {
        console.error("Fout bij het aanmaken van bevestiging:", error);
        return new Response(JSON.stringify({
            succes: false,
            bericht: "Er is een fout opgetreden. De bevestiging kon niet worden aangemaakt."
        }), { status: 500 });
    } finally {
        await sluitDatabase(database);
    }
}
