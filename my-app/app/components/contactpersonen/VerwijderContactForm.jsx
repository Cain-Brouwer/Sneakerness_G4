"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerwijderContactForm({ contactpersoon, onClose }) {
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
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("De contactpersoon is succesvol verwijderd.");
                setTimeout(() => {
                    router.refresh();
                    onClose();
                }, 1500);
            } else {
                setError(data.error || "Er is een fout opgetreden. De contactpersoon kon niet worden verwijderd.");
            }
        } catch (err) {
            setError("Er is een fout opgetreden. De contactpersoon kon niet worden verwijderd.");
            console.error("Fout bij het verwijderen van contactpersoon:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-red-500">Contactpersoon Verwijderen</h2>
                <p className="mb-4 text-sm text-neutral-300">
                    Weet je zeker dat je <strong className="text-white">{contactpersoon.Naam}</strong> definitief wilt verwijderen?
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verwijderen...' : 'Verwijderen opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
