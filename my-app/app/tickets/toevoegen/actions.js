'use server';

import { createTicket, getTicketTypes } from '../../../lib/database/tickets';

const MELDING_SUCCES = 'Het ticket is succesvol aangemaakt.';
const MELDING_FOUT = 'Er is een fout opgetreden. Het ticket kon niet worden toegevoegd.';

// Controleert alle velden en geeft per veld een foutmelding terug (leeg object = alles correct).
function valideer(values, ticketTypes) {
    const errors = {};

    if (!values.ticketnaam) {
        errors.ticketnaam = 'Vul een ticketnaam in.';
    } else if (values.ticketnaam.length > 100) {
        errors.ticketnaam = 'De ticketnaam mag maximaal 100 tekens bevatten.';
    }

    // Het gekozen tickettype moet echt in de database bestaan.
    if (!values.tickettypeId) {
        errors.tickettypeId = 'Kies een tickettype.';
    } else if (!ticketTypes.some((type) => String(type.id) === values.tickettypeId)) {
        errors.tickettypeId = 'Kies een geldig tickettype.';
    }

    if (!values.prijs) {
        errors.prijs = 'Vul een prijs in.';
    } else if (!/^\d+([.,]\d{1,2})?$/.test(values.prijs)) {
        errors.prijs = 'Vul een geldige prijs in (bijvoorbeeld 25 of 25,50).';
    }

    if (!values.aantalBeschikbaar) {
        errors.aantalBeschikbaar = 'Vul het aantal beschikbare tickets in.';
    } else if (!/^\d+$/.test(values.aantalBeschikbaar)) {
        errors.aantalBeschikbaar = 'Vul een geheel getal van 0 of hoger in.';
    }

    if (!values.evenementdatum) {
        errors.evenementdatum = 'Kies een evenementdatum.';
    } else {
        const datum = new Date(`${values.evenementdatum}T00:00:00Z`);
        const isGeldig =
            /^\d{4}-\d{2}-\d{2}$/.test(values.evenementdatum) &&
            !Number.isNaN(datum.getTime()) &&
            datum.toISOString().slice(0, 10) === values.evenementdatum;

        if (!isGeldig) {
            errors.evenementdatum = 'Vul een geldige datum in.';
        }
    }

    if (values.beschrijving.length > 500) {
        errors.beschrijving = 'De beschrijving mag maximaal 500 tekens bevatten.';
    }

    return errors;
}

// Server Action: wordt aangeroepen als de beheerder op "Ticket opslaan" klikt.
export async function addTicket(previousState, formData) {
    const values = {
        ticketnaam: String(formData.get('ticketnaam') ?? '').trim(),
        tickettypeId: String(formData.get('tickettypeId') ?? '').trim(),
        prijs: String(formData.get('prijs') ?? '').trim(),
        aantalBeschikbaar: String(formData.get('aantalBeschikbaar') ?? '').trim(),
        evenementdatum: String(formData.get('evenementdatum') ?? '').trim(),
        beschrijving: String(formData.get('beschrijving') ?? '').trim(),
    };

    // Scenario "Fout bij toevoegen van ticket": er gaat iets mis in het systeem (bijv. database).
    // Het ticket wordt dan niet opgeslagen en de ingevulde waarden blijven staan.
    const systeemFout = () => ({
        status: 'error',
        message: MELDING_FOUT,
        errors: {},
        values,
    });

    let ticketTypes;
    try {
        ticketTypes = await getTicketTypes();
    } catch (error) {
        console.error('Tickettypes ophalen mislukt:', error);
        return systeemFout();
    }

    const errors = valideer(values, ticketTypes);
    if (Object.keys(errors).length > 0) {
        return { status: 'invalid', message: '', errors, values };
    }

    try {
        await createTicket({
            ticketnaam: values.ticketnaam,
            tickettypeId: Number(values.tickettypeId),
            prijs: Math.round(Number(values.prijs.replace(',', '.')) * 100) / 100,
            aantalBeschikbaar: Number(values.aantalBeschikbaar),
            evenementdatum: values.evenementdatum,
            beschrijving: values.beschrijving || null,
        });
    } catch (error) {
        console.error('Ticket opslaan mislukt:', error);
        return systeemFout();
    }

    // Scenario "Ticket succesvol toevoegen": opgeslagen, formulier wordt weer leeg.
    return { status: 'success', message: MELDING_SUCCES, errors: {}, values: {} };
}