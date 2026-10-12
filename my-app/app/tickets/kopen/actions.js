'use server';

import { revalidatePath } from 'next/cache';
import TicketModel from '../../models/ticket.js';
const { BestellingFout } = TicketModel;

const MELDING_SUCCES = 'De aankoop is succesvol afgerond.';
const MELDING_FOUT = 'Er is een fout opgetreden. De aankoop kon niet worden afgerond.';

const EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Controleert alle velden en geeft per veld een foutmelding terug (leeg object = alles correct).
function valideer(values) {
    const errors = {};

    if (!/^\d+$/.test(values.ticketId)) {
        errors.ticketId = 'Kies eerst een dag, een tijdslot en een ticket.';
    }

    if (!values.naam) {
        errors.naam = 'Vul je naam in.';
    } else if (values.naam.length > 100) {
        errors.naam = 'Je naam mag maximaal 100 tekens bevatten.';
    }

    if (!values.email) {
        errors.email = 'Vul je e-mailadres in.';
    } else if (values.email.length > 254 || !EMAIL_PATROON.test(values.email)) {
        errors.email = 'Vul een geldig e-mailadres in.';
    }

    if (!values.aantal) {
        errors.aantal = 'Vul het aantal tickets in.';
    } else if (!/^\d+$/.test(values.aantal) || Number(values.aantal) < 1) {
        errors.aantal = 'Vul een geheel getal van 1 of hoger in.';
    }

    return errors;
}

// Server Action: wordt aangeroepen als de bezoeker op "Bestelling afronden" klikt.
export async function koopTickets(previousState, formData) {
    const values = {
        ticketId: String(formData.get('ticketId') ?? '').trim(),
        naam: String(formData.get('naam') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        aantal: String(formData.get('aantal') ?? '').trim(),
    };

    // Testhulp voor het foutscenario: /tickets/kopen?debug=1 zet dit verborgen veld in het formulier.
    const simuleerFout = formData.get('simuleerFout') === '1';

    const errors = valideer(values);
    if (Object.keys(errors).length > 0) {
        return { status: 'invalid', message: '', errors, values, bestelling: null };
    }

    let bestelling;
    try {
        if (simuleerFout) {
            throw new Error('Handmatig getriggerde fout voor testdoeleinden');
        }

        bestelling = await TicketModel.purchase({
            ticketId: Number(values.ticketId),
            naam: values.naam,
            email: values.email,
            aantal: Number(values.aantal),
        });
    } catch (error) {
        // Melding die de bezoeker mag zien, bijv. "Dit ticket is helaas uitverkocht."
        if (error instanceof BestellingFout) {
            return { status: 'error', message: error.message, errors: {}, values, bestelling: null };
        }

        // Scenario "Fout bij kopen van ticket": er gaat iets mis in het systeem (bijv. database).
        // De aankoop wordt dan niet geregistreerd en de ingevulde waarden blijven staan.
        console.error('Ticket kopen mislukt:', error);
        return { status: 'error', message: MELDING_FOUT, errors: {}, values, bestelling: null };
    }

    // De voorraad is veranderd: ververs de pagina's die tickets tonen.
    revalidatePath('/tickets/kopen');
    revalidatePath('/tickets');

    // Scenario "Ticket succesvol kopen": opgeslagen, het stappenplan wordt weer leeg.
    return {
        status: 'success',
        message: MELDING_SUCCES,
        errors: {},
        values: {},
        bestelling: {
            ticketnaam: bestelling.ticketnaam,
            aantal: Number(values.aantal),
            totaalCenten: bestelling.totaalCenten,
        },
    };
}