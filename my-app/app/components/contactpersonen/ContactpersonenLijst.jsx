"use client";

import { useEffect, useState } from 'react';
import Line from './Line';
import Button from './CreateButton';

export default function ContactpersonenLijst({ contactpersonen }) {
    const [verkopers, setVerkopers] = useState([]);
    const [selecties, setSelecties] = useState({});
    const [meldingen, setMeldingen] = useState({});
    const [laden, setLaden] = useState({});

    useEffect(() => {
        fetch('/api/verkopers')
            .then((res) => res.json())
            .then((data) => setVerkopers(data))
            .catch((err) => console.error('Verkopers ophalen mislukt:', err));
    }, []);

    function selectieWijzigen(contactpersoonId, verkoperId) {
        setSelecties((prev) => ({ ...prev, [contactpersoonId]: verkoperId }));
        setMeldingen((prev) => {
            const nieuwe = { ...prev };
            delete nieuwe[contactpersoonId];
            return nieuwe;
        });
    }

    async function koppelen(contactpersoon) {
        const verkoperId = selecties[contactpersoon.id];

        if (!verkoperId) {
            setMeldingen((prev) => ({
                ...prev,
                [contactpersoon.id]: { type: 'fout', tekst: 'Selecteer een verkoper om te koppelen.' },
            }));
            return;
        }

        setLaden((prev) => ({ ...prev, [contactpersoon.id]: true }));

        try {
            const response = await fetch(`/api/verkopers/${verkoperId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactpersoonId: contactpersoon.id }),
            });

            const data = await response.json();

            if (response.ok) {
                setMeldingen((prev) => ({
                    ...prev,
                    [contactpersoon.id]: { type: 'succes', tekst: 'Contactpersoon succesvol gekoppeld aan verkoper.' },
                }));
                setSelecties((prev) => {
                    const nieuwe = { ...prev };
                    delete nieuwe[contactpersoon.id];
                    return nieuwe;
                });
            } else {
                setMeldingen((prev) => ({
                    ...prev,
                    [contactpersoon.id]: { type: 'fout', tekst: data.error || 'Koppelen is mislukt.' },
                }));
            }
        } catch (err) {
            console.error('Koppelen mislukt:', err);
            setMeldingen((prev) => ({
                ...prev,
                [contactpersoon.id]: { type: 'fout', tekst: 'Er is een fout opgetreden.' },
            }));
        } finally {
            setLaden((prev) => ({ ...prev, [contactpersoon.id]: false }));
        }
    }

    return (
        <section
            className="flex flex-1 flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-all">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-orange-500">Contactpersonen</h2>
            <Button />
            <Line />
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="hidden md:table-header-group">
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-xs">
                        <th className="pb-3 font-semibold">Naam</th>
                        <th className="pb-3 font-semibold">Telefoonnummer</th>
                        <th className="pb-3 font-semibold">E-mail</th>
                        <th className="pb-3 font-semibold">Koppel aan verkoper</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                    {contactpersonen.map((contactpersoon) => (
                        <tr key={contactpersoon.id}
                            className="block py-3 md:table-row hover:bg-neutral-800/40 transition-colors">
                            <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3 font-medium text-white">
                                <span className="md:hidden text-xs uppercase text-neutral-500">Naam</span>
                                <span className="text-right">{contactpersoon.Naam}</span>
                            </td>
                            <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3 text-orange-400 font-bold">
                                <span className="md:hidden text-xs uppercase text-neutral-500">Telefoon</span>
                                <span className="text-right">{contactpersoon.Telefoonnummer}</span>
                            </td>
                            <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3 text-neutral-300 break-all">
                                <span className="md:hidden text-xs uppercase text-neutral-500">E-mail</span>
                                <span className="text-right">{contactpersoon.Email}</span>
                            </td>
                            <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3">
                                <span className="md:hidden text-xs uppercase text-neutral-500">Koppel</span>
                                <div className="flex flex-col gap-1.5 items-end">
                                    <div className="flex gap-2">
                                        <select
                                            value={selecties[contactpersoon.id] || ''}
                                            onChange={(e) => selectieWijzigen(contactpersoon.id, e.target.value)}
                                            className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                                        >
                                            <option value="">Verkoper kiezen...</option>
                                            {verkopers.map((verkoper) => (
                                                <option key={verkoper.id} value={verkoper.id}>
                                                    {verkoper.naam}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => koppelen(contactpersoon)}
                                            disabled={laden[contactpersoon.id] || !selecties[contactpersoon.id]}
                                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {laden[contactpersoon.id] ? 'Bezig...' : 'Koppel'}
                                        </button>
                                    </div>
                                    {meldingen[contactpersoon.id] && (
                                        <span
                                            className={`text-xs ${
                                                meldingen[contactpersoon.id].type === 'succes'
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                            }`}
                                        >
                                            {meldingen[contactpersoon.id].tekst}
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
