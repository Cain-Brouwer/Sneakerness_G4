"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerkoperDetail({ verkoperId }) {
    const router = useRouter();
    const [verkoper, setVerkoper] = useState(null);
    const [gekoppeldeContactpersonen, setGekoppeldeContactpersonen] = useState([]);
    const [contactpersonenLijst, setContactpersonenLijst] = useState([]);
    const [geselecteerdeContactpersoon, setGeselecteerdeContactpersoon] = useState("");
    const [melding, setMelding] = useState({ tekst: "", type: "" });
    const [laadstatus, setLaadstatus] = useState("laden");

    useEffect(() => {
        async function haalDataOp() {
            try {
                // Haal verkoper details op
                const verkoperAntwoord = await fetch(`/api/verkopers/${verkoperId}`, {
                    cache: "no-store",
                });

                if (!verkoperAntwoord.ok) {
                    setLaadstatus("fout");
                    return;
                }

                const verkoperData = await verkoperAntwoord.json();
                setVerkoper(verkoperData.verkoper);
                setGekoppeldeContactpersonen(verkoperData.gekoppeldeContactpersonen);

                // Haal alle contactpersonen op voor de dropdown
                const contactpersonenAntwoord = await fetch("/api/contactpersonen-lijst", {
                    cache: "no-store",
                });

                if (contactpersonenAntwoord.ok) {
                    const contactpersonenData = await contactpersonenAntwoord.json();
                    setContactpersonenLijst(contactpersonenData);
                }

                setLaadstatus("klaar");
            } catch (fout) {
                console.error(fout);
                setLaadstatus("fout");
            }
        }

        haalDataOp();
    }, [verkoperId]);

    async function handleKoppelen(event) {
        event.preventDefault();

        // Verwijder vorige melding
        setMelding({ tekst: "", type: "" });

        if (!geselecteerdeContactpersoon) {
            setMelding({
                tekst: "Selecteer een contactpersoon om te koppelen.",
                type: "fout",
            });
            return;
        }

        try {
            const antwoord = await fetch(`/api/verkopers/${verkoperId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contactpersoonId: Number(geselecteerdeContactpersoon),
                }),
            });

            const data = await antwoord.json();

            if (antwoord.ok) {
                setMelding({
                    tekst: "Contactpersoon succesvol gekoppeld",
                    type: "succes",
                });

                // Haal de bijgewerkte lijst op
                const verkoperAntwoord = await fetch(`/api/verkopers/${verkoperId}`, {
                    cache: "no-store",
                });
                const verkoperData = await verkoperAntwoord.json();
                setGekoppeldeContactpersonen(verkoperData.gekoppeldeContactpersonen);

                // Reset de selectie
                setGeselecteerdeContactpersoon("");
            } else {
                setMelding({
                    tekst: data.error || "Koppelen is mislukt.",
                    type: "fout",
                });
            }
        } catch (fout) {
            console.error(fout);
            setMelding({
                tekst: "Er is een fout opgetreden bij het koppelen.",
                type: "fout",
            });
        }
    }

    function handleTerug() {
        router.push("/verkopers");
    }

    if (laadstatus === "laden") {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center" role="status">
                <span className="h-9 w-9 animate-spin rounded-full border-4 border-neutral-700 border-t-orange-500" />
                <p className="text-neutral-400">Verkoper laden...</p>
            </div>
        );
    }

    if (laadstatus === "fout") {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center text-center" role="alert">
                <h2 className="text-xl font-bold text-neutral-100">Er is iets misgegaan.</h2>
                <p className="mt-2 text-sm text-neutral-400">
                    De verkoper gegevens konden niet worden geladen.
                </p>
                <button
                    type="button"
                    onClick={handleTerug}
                    className="mt-6 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                    Terug naar overzicht
                </button>
            </div>
        );
    }

    if (!verkoper) {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <h2 className="text-xl font-bold text-neutral-100">Verkoper niet gevonden.</h2>
                <button
                    type="button"
                    onClick={handleTerug}
                    className="mt-6 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                    Terug naar overzicht
                </button>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {/* Terug knop */}
            <button
                type="button"
                onClick={handleTerug}
                className="flex items-center gap-2 text-sm font-semibold text-orange-400 transition-colors hover:text-orange-300"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Terug naar overzicht
            </button>

            {/* Verkoper gegevens */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg">
                <h2 className="text-2xl font-extrabold uppercase tracking-widest text-neutral-100">
                    {verkoper.naam}
                </h2>

                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailVeld label="Verkoopt" waarde={verkoper.verkooptSoort} />
                    <DetailVeld label="Dagen" waarde={verkoper.dagen === 1 ? "1 dag" : `${verkoper.dagen} dagen`} />
                    <DetailVeld
                        label="Status"
                        waarde={
                            verkoper.specialeStatus
                                ? <span className="inline-flex rounded-full border border-orange-800 bg-orange-950/60 px-2.5 py-1 text-xs font-semibold text-orange-300">Partner</span>
                                : <span className="inline-flex rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-400">Standaard</span>
                        }
                    />
                    {verkoper.logo && (
                        <DetailVeld
                            label="Logo"
                            waarde={
                                <a
                                    href={verkoper.logo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-orange-400 transition-colors hover:text-orange-300"
                                >
                                    Logo bekijken
                                </a>
                            }
                        />
                    )}
                </dl>
            </div>

            {/* Gekoppelde contactpersonen */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-neutral-100">Gekoppelde contactpersonen</h3>

                {gekoppeldeContactpersonen.length === 0 ? (
                    <p className="text-sm text-neutral-500">Nog geen contactpersonen gekoppeld.</p>
                ) : (
                    <div className="space-y-3">
                        {gekoppeldeContactpersonen.map((contactpersoon) => (
                            <div
                                key={contactpersoon.id}
                                className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4"
                            >
                                <p className="font-bold text-neutral-100">{contactpersoon.Naam}</p>
                                {contactpersoon.Telefoonnummer && (
                                    <p className="text-sm text-neutral-400">📞 {contactpersoon.Telefoonnummer}</p>
                                )}
                                {contactpersoon.Email && (
                                    <p className="text-sm text-neutral-400">✉️ {contactpersoon.Email}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Koppel nieuwe contactpersoon */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-neutral-100">Koppel contactpersoon</h3>

                <form onSubmit={handleKoppelen} className="space-y-4">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-400">
                        Selecteer een contactpersoon
                        <select
                            value={geselecteerdeContactpersoon}
                            onChange={(event) => setGeselecteerdeContactpersoon(event.target.value)}
                            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        >
                            <option value="">-- Kies een contactpersoon --</option>
                            {contactpersonenLijst.map((contactpersoon) => (
                                <option key={contactpersoon.id} value={contactpersoon.id}>
                                    {contactpersoon.Naam} ({contactpersoon.Email})
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                        Koppelen
                    </button>
                </form>
            </div>

            {/* Melding */}
            {melding.tekst && (
                <MeldingBalk tekst={melding.tekst} type={melding.type} />
            )}
        </section>
    );
}

function DetailVeld({ label, waarde }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
            <dd className="mt-1 text-neutral-300">{waarde}</dd>
        </div>
    );
}

function MeldingBalk({ tekst, type }) {
    const stijl = type === "succes"
        ? "border-green-800 bg-green-950/60 text-green-300"
        : "border-red-800 bg-red-950/60 text-red-300";

    return (
        <div className={`rounded-xl border p-4 shadow-lg ${stijl}`} role="alert">
            <p className="font-semibold">{tekst}</p>
        </div>
    );
}
