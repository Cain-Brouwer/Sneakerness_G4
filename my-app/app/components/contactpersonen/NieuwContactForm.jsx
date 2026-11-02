'use client';

import { useState } from 'react';
import { voegContactpersoonFormulierAan } from '../../contactpersonen/actions';

export default function NieuwContactForm() {
    const [error, setError] = useState('');
    const [values, setValues] = useState({
        naam: '',
        telefoonnummer: '',
        email: '',
        opmerking: ''
    });

    async function handleSubmit(formData) {
        const result = await voegContactpersoonFormulierAan(null, formData);
        if (result && result.error) {
            setError(result.error);
            if (result.values) {
                setValues(result.values);
            }
        }
    }

    return (
        <section className="flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 hover:border-neutral-700 transition-all">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-orange-500">Nieuwe contactpersoon</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form action={handleSubmit} className="space-y-4">
                {/* Naam */}
                <div>
                    <label htmlFor="naam" className="block w-3/4 mx-auto text-sm font-medium text-neutral-300 mb-1 text-left">
                        Naam <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        id="naam"
                        name="naam"
                        defaultValue={values.naam}
                        required
                        className="block w-3/4 mx-auto px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-orange-500"
                    />
                </div>

                {/* Telefoonnummer */}
                <div>
                    <label htmlFor="telefoonnummer" className="block w-3/4 mx-auto text-sm font-medium text-neutral-300 mb-1 text-left">
                        Telefoonnummer <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="tel"
                        id="telefoonnummer"
                        name="telefoonnummer"
                        defaultValue={values.telefoonnummer}
                        required
                        className="block w-3/4 mx-auto px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-orange-500"
                    />
                </div>

                {/* E-mail */}
                <div>
                    <label htmlFor="email" className="block w-3/4 mx-auto text-sm font-medium text-neutral-300 mb-1 text-left">
                        E-mail <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={values.email}
                        required
                        className="block w-3/4 mx-auto px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-orange-500"
                    />
                </div>

                {/* Opmerking */}
                <div>
                    <label htmlFor="opmerking" className="block w-3/4 mx-auto text-sm font-medium text-neutral-300 mb-1 text-left">
                        Opmerking
                    </label>
                    <textarea
                        id="opmerking"
                        name="opmerking"
                        defaultValue={values.opmerking}
                        rows="3"
                        className="block w-3/4 mx-auto px-3 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-100 focus:outline-none focus:border-orange-500 resize-none"
                    />
                </div>

                {/* Knoppen */}
                <div className="flex justify-end gap-3 pt-2">
                    <a
                        href="/contactpersonen"
                        className="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 transition-colors"
                    >
                        Annuleren
                    </a>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
                    >
                        Opslaan
                    </button>
                </div>
            </form>
        </section>
    );
}
