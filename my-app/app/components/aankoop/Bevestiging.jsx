'use client';

import {useState} from 'react';

export default function Bevestiging() {
    const [bestellerNaam, setBestellerNaam] = useState('');
    const [bestellerEmail, setBestellerEmail] = useState('');
    const [aantalTickets, setAantalTickets] = useState(1);
    const [ticketType, setTicketType] = useState('dagticket');
    const [forceerFout, setForceerFout] = useState(false);

    const [bevestiging, setBevestiging] = useState(null);
    const [fout, setFout] = useState(null);
    const [laden, setLaden] = useState(false);

    const prijzen = {
        'dagticket': '25,00',
        'weekendticket': '45,00',
        'vip-ticket': '75,00'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLaden(true);
        setBevestiging(null);
        setFout(null);

        try {
            const response = await fetch('/api/aankoop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bestellerNaam,
                    bestellerEmail,
                    aantalTickets,
                    ticketType,
                    prijs: prijzen[ticketType],
                    forceerFout
                })
            });

            const data = await response.json();

            if (response.ok && data.succes) {
                setBevestiging({
                    id: data.bevestigingId,
                    bestellerNaam,
                    bestellerEmail,
                    aantalTickets,
                    ticketType,
                    prijs: prijzen[ticketType],
                    datum: new Date().toLocaleString('nl-NL')
                });
            } else {
                setFout(data.bericht || "Er is een fout opgetreden. De bevestiging kon niet worden aangemaakt.");
            }
        } catch (error) {
            setFout("Er is een fout opgetreden. De bevestiging kon niet worden aangemaakt.");
        } finally {
            setLaden(false);
        }
    };

    return (
        <section className="flex flex-1 flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-all">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-orange-500">Ticket Aankoop</h2>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Naam</label>
                    <input
                        type="text"
                        value={bestellerNaam}
                        onChange={(e) => setBestellerNaam(e.target.value)}
                        required
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm text-neutral-400 mb-1">E-mail</label>
                    <input
                        type="email"
                        value={bestellerEmail}
                        onChange={(e) => setBestellerEmail(e.target.value)}
                        required
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Aantal tickets</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={aantalTickets}
                        onChange={(e) => setAantalTickets(parseInt(e.target.value))}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Ticket type</label>
                    <select
                        value={ticketType}
                        onChange={(e) => setTicketType(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    >
                        <option value="dagticket">Dagticket - €25,00</option>
                        <option value="weekendticket">Weekendticket - €45,00</option>
                        <option value="vip-ticket">VIP-ticket - €75,00</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="forceerFout"
                        checked={forceerFout}
                        onChange={(e) => setForceerFout(e.target.checked)}
                        className="rounded bg-neutral-800 border-neutral-700"
                    />
                    <label htmlFor="forceerFout" className="text-sm text-neutral-400">
                        Fout simuleren (voor testen)
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={laden}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {laden ? 'Bezig met verwerken...' : 'Tickets kopen'}
                </button>
            </form>

            {fout && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                    <p className="text-red-400 font-semibold">{fout}</p>
                </div>
            )}

            {bevestiging && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                    <h3 className="text-green-400 font-bold text-lg mb-3">✓ Bevestiging succesvol!</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Bevestigingsnummer:</span>
                            <span className="text-white font-mono">#{bevestiging.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Besteller:</span>
                            <span className="text-white">{bevestiging.bestellerNaam}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">E-mail:</span>
                            <span className="text-white">{bevestiging.bestellerEmail}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Aantal tickets:</span>
                            <span className="text-white">{bevestiging.aantalTickets}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Ticket type:</span>
                            <span className="text-white capitalize">{bevestiging.ticketType.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Prijs per ticket:</span>
                            <span className="text-white">€{bevestiging.prijs}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-700 pt-2">
                            <span className="text-neutral-400 font-bold">Totaal:</span>
                            <span className="text-white font-bold">
                                €{(parseFloat(bevestiging.prijs.replace(',', '.')) * bevestiging.aantalTickets).toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Datum:</span>
                            <span className="text-white">{bevestiging.datum}</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
