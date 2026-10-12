"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ToevoegenFoutmelding from "../../components/error-handling/toevoegen-foutmelding.jsx";
import { standtypes } from "../../../lib/stand-validatie";
import { valideerStandReservering } from "../../../lib/stand-reservering-validatie";

const veldstijl = "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";
const knopstijl = "min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60";

export default function StandReserverenFormulier() {
  const [gegevens, setGegevens] = useState({ stands: [], verkopers: [], reserveringen: [] });
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwPoging, setOpnieuwPoging] = useState(0);
  const [standId, setStandId] = useState("");
  const [verkoperId, setVerkoperId] = useState("");
  const [fouten, setFouten] = useState({});
  const [melding, setMelding] = useState("");
  const [serverfout, setServerfout] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [succes, setSucces] = useState("");
  const aanvraagBezig = useRef(false);
  const gekozenStand = gegevens.stands.find(stand => stand.id === Number(standId));

  useEffect(() => {
    const controller = new AbortController();
    async function haalBeschikbareStandsOp() {
      try {
        const antwoord = await fetch("/api/stands/reserveringen", { signal: controller.signal, cache: "no-store" });
        if (!antwoord.ok) throw new Error("Ophalen mislukt");
        const resultaat = await antwoord.json();
        if (controller.signal.aborted) return;
        setGegevens(resultaat);
        setLaadstatus("klaar");
      } catch (fout) {
        if (fout.name !== "AbortError") setLaadstatus("fout");
      }
    }
    haalBeschikbareStandsOp();
    return () => controller.abort();
  }, [opnieuwPoging]);

  function probeerOpnieuw() {
    setOpnieuwPoging(poging => poging + 1);
  }

  async function reserveerStand(event) {
    event.preventDefault();
    if (aanvraagBezig.current) return;
    const formulier = event.currentTarget;
    const invoer = Object.fromEntries(new FormData(formulier));
    invoer.standId = Number(standId);
    invoer.verkoperId = Number(verkoperId);
    const validatie = valideerStandReservering(invoer);
    setFouten(validatie.fouten);
    setMelding("");
    setServerfout(false);
    setSucces("");
    if (Object.keys(validatie.fouten).length) {
      setMelding("Vul de ontbrekende gegevens in en controleer de gemarkeerde velden.");
      formulier.elements[Object.keys(validatie.fouten)[0]]?.focus();
      return;
    }
    aanvraagBezig.current = true;
    setBezig(true);
    try {
      const antwoord = await fetch("/api/stands/reserveringen", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validatie.gegevens),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setFouten(resultaat.fouten ?? {});
        setServerfout(antwoord.status >= 500);
        setMelding(resultaat.error ?? "De stand kon niet worden gereserveerd. Probeer opnieuw.");
        if (antwoord.status === 409) {
          setStandId("");
          probeerOpnieuw();
        }
        return;
      }
      const verkoper = gegevens.verkopers.find(item => item.id === Number(verkoperId));
      setSucces(`Stand ${gekozenStand.standnummer} is gereserveerd voor ${verkoper.naam}.`);
      // De gereserveerde stand verdwijnt meteen uit de beschikbare keuzes.
      setGegevens(vorig => ({ ...vorig, stands: vorig.stands.filter(stand => stand.id !== resultaat.standId) }));
      formulier.reset();
      setStandId("");
      setVerkoperId("");
      probeerOpnieuw();
    } catch {
      setServerfout(true);
      setMelding("De stand kon niet worden gereserveerd. Probeer opnieuw.");
    } finally {
      aanvraagBezig.current = false;
      setBezig(false);
    }
  }

  function toonVeldfout(veld) {
    return fouten[veld] ? <p id={`${veld}-fout`} className="mt-2 text-sm text-orange-400">{fouten[veld]}</p> : null;
  }
  function leesToegankelijkheid(veld) {
    return { "aria-invalid": Boolean(fouten[veld]), "aria-describedby": fouten[veld] ? `${veld}-fout` : undefined };
  }

  return (
    <section className="mx-auto max-w-2xl min-w-0 space-y-8">
      {laadstatus === "laden" && <p role="status" className="py-10 text-center text-neutral-300">Beschikbare stands en verkopers laden…</p>}
      {laadstatus === "fout" && <ToevoegenFoutmelding melding="De reserveringsgegevens konden niet worden geladen." probeerOpnieuw={probeerOpnieuw} />}
      {succes && <p role="status" className="rounded-xl border border-orange-900 bg-orange-950/30 p-4 text-orange-300">{succes}</p>}
      <form onSubmit={reserveerStand} noValidate aria-busy={bezig} hidden={laadstatus !== "klaar"} className="min-w-0 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8">
        <p className="mb-6 text-sm text-neutral-400">Velden met * zijn verplicht.</p>
        {melding && (serverfout ? <ToevoegenFoutmelding melding={melding} bezig={bezig} /> : <p role="alert" className="mb-6 text-orange-400">{melding}</p>)}
        {gegevens.stands.length === 0 && <p role="status" className="mb-6 text-neutral-300">Geen beschikbare stands gevonden.</p>}
        {gegevens.verkopers.length === 0 && <p role="status" className="mb-6 text-neutral-300">Geen actieve verkopers gevonden. <Link href="/verkopers/toevoegen" className="text-orange-400 underline">Voeg eerst een verkoper toe.</Link></p>}
        <fieldset disabled={bezig} className="min-w-0 space-y-5 disabled:opacity-70">
          <div>
            <label htmlFor="verkoperId" className="text-sm font-semibold text-neutral-300">Verkoper *</label>
            <select id="verkoperId" name="verkoperId" value={verkoperId} onChange={event => setVerkoperId(event.target.value)} required className={veldstijl} {...leesToegankelijkheid("verkoperId")}>
              <option value="">Kies een verkoper</option>
              {gegevens.verkopers.map(verkoper => <option key={verkoper.id} value={verkoper.id}>{verkoper.naam}</option>)}
            </select>
            {toonVeldfout("verkoperId")}
          </div>
          <div>
            <label htmlFor="standId" className="text-sm font-semibold text-neutral-300">Stand *</label>
            <select id="standId" name="standId" value={standId} onChange={event => setStandId(event.target.value)} required className={veldstijl} {...leesToegankelijkheid("standId")}>
              <option value="">Kies een beschikbare stand</option>
              {gegevens.stands.map(stand => <option key={stand.id} value={stand.id}>{stand.standnummer} — {standtypes[stand.standtype]}</option>)}
            </select>
            {toonVeldfout("standId")}
          </div>
          <dl className="grid min-w-0 gap-3 rounded-xl bg-neutral-950 p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-neutral-400">Standtype</dt><dd className="mt-1 break-words">{standtypes[gekozenStand?.standtype] ?? "—"}</dd></div>
            <div><dt className="text-neutral-400">Locatie / Hal</dt><dd className="mt-1 break-words">{gekozenStand?.locatie || "Niet opgegeven"}</dd></div>
            <div><dt className="text-neutral-400">Prijs</dt><dd className="mt-1">{gekozenStand?.prijsCenten == null ? "Niet opgegeven" : new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(gekozenStand.prijsCenten / 100)}</dd></div>
            <div><dt className="text-neutral-400">Status na reserveren</dt><dd className="mt-1 text-orange-400">Gereserveerd</dd></div>
          </dl>
          {[["evenementdatum", "Evenementdatum"], ["startdatum", "Startdatum"], ["einddatum", "Einddatum"]].map(([veld, label]) => (
            <div key={veld} className="min-w-0">
              <label htmlFor={veld} className="text-sm font-semibold text-neutral-300">{label} *</label>
              <input id={veld} name={veld} type="date" required className={`${veldstijl} [color-scheme:dark]`} {...leesToegankelijkheid(veld)} />
              {toonVeldfout(veld)}
            </div>
          ))}
          <div>
            <label htmlFor="opmerking" className="text-sm font-semibold text-neutral-300">Opmerkingen / Bijzonderheden</label>
            <textarea id="opmerking" name="opmerking" rows={4} maxLength={2000} className={`${veldstijl} resize-y`} {...leesToegankelijkheid("opmerking")} />
            {toonVeldfout("opmerking")}
          </div>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <button type="submit" disabled={bezig || !gegevens.stands.length || !gegevens.verkopers.length} className={knopstijl}>{bezig ? "Bezig met reserveren…" : "Stand Reserveren"}</button>
            <Link href="/stands" className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold hover:bg-neutral-700">Annuleren</Link>
          </div>
        </fieldset>
      </form>
      {gegevens.reserveringen.length > 0 && (
        <section className="min-w-0 rounded-2xl border border-neutral-800 p-5 sm:p-8">
          <h2 className="text-lg font-bold">Gereserveerde stands</h2>
          <ul className="mt-4 space-y-3">
            {gegevens.reserveringen.map(reservering => <li key={reservering.standId} className="break-words rounded-xl bg-neutral-900 p-4"><span className="font-bold">{reservering.standnummer}</span> — {reservering.verkoperNaam}<span className="mt-1 block text-sm text-orange-400">{reservering.status}</span>{reservering.startdatum && <span className="mt-1 block text-sm text-neutral-400">{reservering.startdatum} t/m {reservering.einddatum}</span>}</li>)}
          </ul>
        </section>
      )}
    </section>
  );
}
