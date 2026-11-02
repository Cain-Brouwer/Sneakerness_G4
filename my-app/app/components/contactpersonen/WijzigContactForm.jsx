"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WijzigContactForm({ contactpersoon, onClose }) {
    const [naam, setNaam] = useState(contactpersoon.Naam);
    const [telefoonnummer, setTelefoonnummer] = useState(contactpersoon.Telefoonnummer);
    const [email, setEmail] = useState(contactpersoon.Email);
    const [isActief, setIsActief] = useState(contactpersoon.IsActief === 1);
    const [opmerking, setOpmerking] = useState(contactpersoon.Opmerking || '');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`/api/contactpersonen/${contactpersoon.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    naam,
                    telefoonnummer,
                    email,
                    isActief: isActief ? 1 : 0,
                    opmerking,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("De wijzigingen zijn succesvol opgeslagen.");
                setTimeout(() => {
                    router.refresh();
                    onClose();
                }, 1500);
            } else {
                setError(data.error || "Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.");
            }
        } catch (err) {
            setError("Er is een fout opgetreden. De wijzigingen konden niet worden opgeslagen.");
            console.error("Fout bij het wijzigen van contactpersoon:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-orange-500">Contactpersoon Wijzigen</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="naam" className="block text-sm font-medium text-neutral-300 mb-1">Naam *</label>
                        <input
                            type="text"
                            id="naam"
                            value={naam}
                            onChange={(e) => setNaam(e.target.value)}
                            required
                            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="telefoonnummer" className="block text-sm font-medium text-neutral-300 mb-1">Telefoonnummer *</label>
                        <input
                            type="tel"
                            id="telefoonnummer"
                            value={telefoonnummer}
                            onChange={(e) => setTelefoonnummer(e.target.value)}
                            required
                            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">E-mail *</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="isActief" className="block text-sm font-medium text-neutral-300 mb-1">Actief</label>
                        <input
                            type="checkbox"
                            id="isActief"
                            checked={isActief}
                            onChange={(e) => setIsActief(e.target.checked)}
                            className="rounded bg-neutral-800 border-neutral-700 text-orange-500 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="opmerking" className="block text-sm font-medium text-neutral-300 mb-1">Opmerking</label>
                        <textarea
                            id="opmerking"
                            value={opmerking}
                            onChange={(e) => setOpmerking(e.target.value)}
                            rows="3"
                            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
                            {success}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-600"
                        >
                            Annuleren
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
