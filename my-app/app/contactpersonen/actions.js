'use server';

import { redirect } from 'next/navigation';
import { create } from '../models/contactpersoon.js';

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
