"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { meldingVerwijderenSucces, meldingVerwijderenFout } from "../../../../lib/verkoper-verwijderen-validatie.js";

const knopstijl = "min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-wait disabled:opacity-60";

export default function VerkoperVerwijderenBevestiging({ verkoperId }) {
  const [verkoper, setVerkoper] = useState(null);
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwPoging, setOpnieuwPoging] = useState(0);
  const [melding, setMelding] = useState("");
  const [bezig, setBezig] = useState(false);
  const [verwijderd, setVerwijderd] = useState(false);
  const aanvraagBezig = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function haalVerkoperOp() {
      try {
        const antwoord = await fetch(`/api/verkopers/${verkoperId}`, { signal: controller.signal, cache: "no-store" });
        if (controller.signal.aborted) return;
        if (antwoord.status === 404) { setLaadstatus("niet-gevonden"); return; }
        if (!antwoord.ok) throw new Error("Ophalen mislukt");
        const gegevens = await antwoord.json();
        if (controller.signal.aborted) return;
        setVerkoper(gegevens);
        setLaadstatus("klaar");
      } catch (fout) {
        if (fout.name !== "AbortError") setLaadstatus("fout");
      }
    }
    haalVerkoperOp();
    return () => controller.abort();
  }, [verkoperId, opnieuwPoging]);

  function probeerOpnieuw() {
    setLaadstatus("laden");
    setOpnieuwPoging(poging => poging + 1);
  }

  async function verwijderVerkoper(event) {
    event.preventDefault();
    if (aanvraagBezig.current || verwijderd) return;
    aanvraagBezig.current = true;
    setBezig(true);
    setMelding("");
    try {
      // De definitieve aanvraag vindt alleen plaats na bevestiging op deze pagina.
      const antwoord = await fetch(`/api/verkopers/${verkoperId}/verwijderen`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bevestigd: true }),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setMelding(antwoord.status >= 500 ? meldingVerwijderenFout : resultaat.error ?? meldingVerwijderenFout);
        return;
      }
      setVerwijderd(true);
    } catch {
      setMelding(meldingVerwijderenFout);
    } finally {
      aanvraagBezig.current = false;
      setBezig(false);
    }
  }

  if (verwijderd) return <div className="space-y-6 py-12 text-center"><p role="status" className="text-lg font-semibold text-orange-400">{meldingVerwijderenSucces}</p><Link href="/verkopers" prefetch={false} className={`${knopstijl} inline-flex items-center justify-center`}>Terug naar overzicht</Link></div>;
  if (laadstatus === "laden") return <p role="status" className="py-12 text-center text-neutral-400">Verkoper laden…</p>;
  if (laadstatus === "niet-gevonden") return <div className="space-y-6 py-12 text-center"><h2 className="text-xl font-bold">Verkoper niet gevonden.</h2><Link href="/verkopers" className="text-orange-400 underline">Terug naar overzicht</Link></div>;
  if (laadstatus === "fout") return <div role="alert" className="space-y-6 py-12 text-center"><p className="break-words text-2xl font-extrabold tracking-widest text-orange-500">SNEAKERNESS</p><h2 className="text-xl font-bold">Er is iets misgegaan.</h2><p className="text-neutral-400">De verkoper kon niet worden geladen.</p><button type="button" onClick={probeerOpnieuw} className={knopstijl}>Probeer opnieuw</button></div>;

  return (
    <form onSubmit={verwijderVerkoper} aria-busy={bezig} className="mx-auto max-w-4xl min-w-0 space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8">
      <h2 className="break-words rounded-xl border border-neutral-700 p-4 text-center text-lg font-semibold">Weet je zeker dat je deze verkoper wilt verwijderen?</h2>
      <section aria-label="Gegevens van geselecteerde verkoper" className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 sm:p-8">
        <h3 className="break-words text-xl font-bold text-orange-400">{verkoper.naam}</h3>
        <dl className="mt-5 grid min-w-0 gap-5 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">Verkoopsoort</dt><dd className="mt-1 break-words">{verkoper.verkooptSoort}</dd></div>
          <div><dt className="text-neutral-500">Aantal dagen</dt><dd className="mt-1">{verkoper.dagen === 1 ? "1 dag" : `${verkoper.dagen} dagen`}</dd></div>
          <div><dt className="text-neutral-500">Adres</dt><dd className="mt-1 break-words">{[verkoper.adres, verkoper.postcode, verkoper.plaats].filter(Boolean).join(", ") || "Niet opgegeven"}</dd></div>
          <div><dt className="text-neutral-500">Speciale status</dt><dd className="mt-1">{verkoper.specialeStatus ? "Partner" : "Standaard"}</dd></div>
        </dl>
        {verkoper.contactpersonen.length > 0 && <div className="mt-5"><h4 className="text-sm text-neutral-500">Gekoppelde contactpersonen</h4><ul className="mt-2 space-y-2 text-sm">{verkoper.contactpersonen.map(contact => <li key={contact.id} className="break-words">{contact.naam}{contact.email && ` — ${contact.email}`}</li>)}</ul></div>}
      </section>
      <p className="text-sm text-neutral-400">De verkoper wordt definitief verwijderd. Contactpersonen blijven behouden. Verkopers met gekoppelde stands kunnen niet worden verwijderd.</p>
      {melding && <p role="alert" className="break-words text-orange-400">{melding}</p>}
      <div className="grid gap-3 pt-4 sm:grid-cols-2">
        <button type="submit" disabled={bezig} className={knopstijl}>{bezig ? "Bezig met verwijderen…" : "Verwijderen"}</button>
        <Link href={`/verkopers/${verkoperId}`} onClick={event => { if (bezig) event.preventDefault(); }} aria-disabled={bezig} className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold transition hover:bg-neutral-700">Annuleren</Link>
      </div>
    </form>
  );
}
