'use server';

import { redirect } from 'next/navigation';
import { create } from '../models/contactpersoon.js';
import { update } from '../models/contactpersoon.js';

export async function voegContactpersoonFormulierAan(state, formData) {
    const naam = formData.get('naam');
    const telefoonnummer = formData.get('telefoonnummer');
    const email = formData.get('email');
    const isActief = 1;
    const opmerking = formData.get('opmerking');

    if (!naam || !telefoonnummer || !email) {
        return {
            error: 'Naam, telefoonnummer en email zijn verplicht.',
            values: { naam, telefoonnummer, email, isActief, opmerking }
        };
    }

    await create({ naam, telefoonnummer, email, isActief, opmerking });

    redirect('/contactpersonen');
}

export async function wijzigContactpersoonFormulier(formData) {
    const id = formData.get('id');
    const naam = formData.get('naam');
    const telefoonnummer = formData.get('telefoonnummer');
    const email = formData.get('email');
    const isActief = formData.get('isActief') === 'on' ? 1 : 0;
    const opmerking = formData.get('opmerking');

    if (!naam || !telefoonnummer || !email) {
        return {
            error: 'Naam, telefoonnummer en email zijn verplicht.',
            values: { id, naam, telefoonnummer, email, isActief, opmerking }
        };
    }

    try {
        await update(id, { naam, telefoonnummer, email, isActief, opmerking });
        return { success: true, message: 'Contactpersoon succesvol gewijzigd.' };
    } catch (error) {
        console.error('Fout bij het wijzigen van contactpersoon:', error);
        return { error: 'Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.' };
    }
}