"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { standtypes } from "../../../../lib/stand-validatie.js";
import { meldingStandVerwijderenSucces, meldingStandVerwijderenFout } from "../../../../lib/stand-verwijderen-meldingen.js";

const knopstijl = "min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-60";

export default function StandVerwijderenBevestiging({ standId }) {
  const [stand, setStand] = useState(null);
  const [verkoperNaam, setVerkoperNaam] = useState("");
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwPoging, setOpnieuwPoging] = useState(0);
  const [melding, setMelding] = useState("");
  const [bezig, setBezig] = useState(false);
  const [verwijderd, setVerwijderd] = useState(false);
  const aanvraagBezig = useRef(false);
  const heeftKoppeling = Boolean(stand && (stand.verkoperId !== null || stand.heeftReservering || stand.status === "Gereserveerd"));

  useEffect(() => {
    const controller = new AbortController();
    async function haalStandOp() {
      try {
        const antwoord = await fetch(`/api/stands/${standId}`, { signal: controller.signal, cache: "no-store" });
        if (controller.signal.aborted) return;
        if (antwoord.status === 404) { setLaadstatus("niet-gevonden"); return; }
        if (!antwoord.ok) throw new Error("Ophalen mislukt");
        const gegevens = await antwoord.json();
        if (controller.signal.aborted) return;
        setStand(gegevens.stand);
        setVerkoperNaam(gegevens.verkopers.find(verkoper => verkoper.id === gegevens.stand.verkoperId)?.naam ?? "Geen verkoper");
        setLaadstatus("klaar");
      } catch (fout) {
        if (fout.name !== "AbortError") setLaadstatus("fout");
      }
    }
    haalStandOp();
    return () => controller.abort();
  }, [standId, opnieuwPoging]);

  function probeerOpnieuw() {
    setLaadstatus("laden");
    setOpnieuwPoging(poging => poging + 1);
  }

  async function verwijderStand(event) {
    event.preventDefault();
    if (aanvraagBezig.current || verwijderd || heeftKoppeling) return;
    aanvraagBezig.current = true;
    setBezig(true);
    setMelding("");
    try {
      // Alleen de bevestigingsknop verstuurt de definitieve verwijderaanvraag.
      const antwoord = await fetch(`/api/stands/${standId}/verwijderen`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bevestigd: true }),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setMelding(antwoord.status >= 500 ? meldingStandVerwijderenFout : resultaat.error ?? meldingStandVerwijderenFout);
        return;
      }
      setVerwijderd(true);
    } catch {
      setMelding(meldingStandVerwijderenFout);
    } finally {
      aanvraagBezig.current = false;
      setBezig(false);
    }
  }

  if (verwijderd) return <div className="space-y-6 py-12 text-center"><p role="status" className="text-lg font-semibold text-orange-400">{meldingStandVerwijderenSucces}</p><Link href="/stands" prefetch={false} className={`${knopstijl} inline-flex items-center justify-center`}>Terug naar overzicht</Link></div>;
  if (laadstatus === "laden") return <p role="status" className="py-12 text-center text-neutral-400">Stand laden…</p>;
  if (laadstatus === "niet-gevonden") return <div className="space-y-6 py-12 text-center"><h2 className="text-xl font-bold">Stand niet gevonden.</h2><Link href="/stands" className="text-orange-400 underline">Terug naar overzicht</Link></div>;
  if (laadstatus === "fout") return <div role="alert" className="space-y-6 py-12 text-center"><p className="break-words text-2xl font-extrabold tracking-widest text-orange-500">SNEAKERNESS</p><h2 className="text-xl font-bold">Er is iets misgegaan.</h2><p className="text-neutral-400">De standgegevens konden niet worden geladen.</p><button type="button" onClick={probeerOpnieuw} className={knopstijl}>Probeer opnieuw</button></div>;

  return (
    <form onSubmit={verwijderStand} aria-busy={bezig} className="mx-auto max-w-4xl min-w-0 space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8">
      <h2 className="break-words rounded-xl border border-neutral-700 p-4 text-center text-lg font-semibold">Weet je zeker dat je deze stand wilt verwijderen?</h2>
      <section aria-label="Gegevens van geselecteerde stand" className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 sm:p-8">
        <h3 className="break-words text-xl font-bold text-orange-400">Stand {stand.standnummer}</h3>
        <dl className="mt-5 grid min-w-0 gap-5 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">Standtype</dt><dd className="mt-1 break-words">{standtypes[stand.standtype] ?? stand.standtype}</dd></div>
          <div><dt className="text-neutral-500">Verkoper</dt><dd className="mt-1 break-words">{verkoperNaam}</dd></div>
          <div><dt className="text-neutral-500">Hal / Locatie</dt><dd className="mt-1 break-words">{stand.locatie || "Niet opgegeven"}</dd></div>
          <div><dt className="text-neutral-500">Afmeting</dt><dd className="mt-1">{stand.grootte === null ? "Niet opgegeven" : `${stand.grootte} m²`}</dd></div>
          <div><dt className="text-neutral-500">Prijs</dt><dd className="mt-1">{stand.prijsCenten === null ? "Niet opgegeven" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(stand.prijsCenten / 100)}</dd></div>
          <div><dt className="text-neutral-500">Status</dt><dd className="mt-1 break-words">{stand.status}</dd></div>
        </dl>
      </section>
      <p className="text-sm text-neutral-400">De stand wordt definitief verwijderd. Verkopers blijven behouden.</p>
      {heeftKoppeling && <p role="alert" className="text-orange-400">Deze stand heeft een verkoperkoppeling of reservering. Handel die eerst af voordat je de stand verwijdert.</p>}
      {melding && <p role="alert" className="break-words text-orange-400">{melding}</p>}
      <div className="grid gap-3 pt-4 sm:grid-cols-2">
        <button type="submit" disabled={bezig || heeftKoppeling} className={knopstijl}>{bezig ? "Bezig met verwijderen…" : "Verwijderen"}</button>
        <Link href="/stands" onClick={event => { if (bezig) event.preventDefault(); }} aria-disabled={bezig} className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold transition hover:bg-neutral-700">Annuleren</Link>
      </div>
    </form>
  );
}
