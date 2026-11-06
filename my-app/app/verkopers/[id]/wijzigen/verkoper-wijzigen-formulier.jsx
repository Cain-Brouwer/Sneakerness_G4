"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { valideerVerkoperWijziging, meldingWijzigenSucces, meldingWijzigenFout } from "../../../../lib/verkoper-wijzigen-validatie.js";

const invoervelden = [
  ["contactpersoon", "Naam (contactpersoon)", "text", "name", 150],
  ["email", "E-mailadres", "email", "email", 254],
  ["telefoon", "Telefoonnummer", "tel", "tel", 30],
  ["naam", "Bedrijfsnaam", "text", "organization", 150],
  ["adres", "Adres", "text", "street-address", 200],
];
const veldstijl = "min-h-12 w-full min-w-0 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";
const knopstijl = "min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-wait disabled:opacity-60";

export default function VerkoperWijzigenFormulier({ verkoperId }) {
  const [verkoper, setVerkoper] = useState(null);
  const [invoer, setInvoer] = useState({ contactpersoon: "", email: "", telefoon: "", naam: "", adres: "", contactpersoonId: null });
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwPoging, setOpnieuwPoging] = useState(0);
  const [fouten, setFouten] = useState({});
  const [melding, setMelding] = useState("");
  const [meldingsType, setMeldingsType] = useState("");
  const [bezig, setBezig] = useState(false);
  const aanvraagBezig = useRef(false);
  const formulierRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    async function haalVerkoperOp() {
      try {
        const antwoord = await fetch(`/api/verkopers/${verkoperId}`, { signal: controller.signal, cache: "no-store" });
        if (antwoord.status === 404) { setLaadstatus("niet-gevonden"); return; }
        if (!antwoord.ok) throw new Error("Ophalen mislukt");
        const gegevens = await antwoord.json();
        if (controller.signal.aborted) return;
        const contactpersoon = gegevens.contactpersonen[0];
        setVerkoper(gegevens);
        setInvoer({
          naam: gegevens.naam ?? "", adres: gegevens.adres ?? "",
          contactpersoonId: contactpersoon?.id ?? null,
          contactpersoon: contactpersoon?.naam ?? "", email: contactpersoon?.email ?? "", telefoon: contactpersoon?.telefoon ?? "",
        });
        setLaadstatus("klaar");
        setFouten({});
        setMelding("");
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
  function pasVeldAan(event) {
    const { name, value } = event.target;
    setInvoer(vorig => ({ ...vorig, [name]: value }));
    setMelding("");
  }
  function pasContactpersoonAan(event) {
    const contactpersoon = verkoper.contactpersonen.find(contact => contact.id === Number(event.target.value));
    setInvoer(vorig => ({ ...vorig, contactpersoonId: contactpersoon.id, contactpersoon: contactpersoon.naam ?? "", email: contactpersoon.email ?? "", telefoon: contactpersoon.telefoon ?? "" }));
    setFouten({});
    setMelding("");
  }

  async function wijzigVerkoper(event) {
    event.preventDefault();
    if (aanvraagBezig.current) return;
    const validatie = valideerVerkoperWijziging(invoer);
    setFouten(validatie.fouten);
    setMelding("");
    if (Object.keys(validatie.fouten).length) {
      setMeldingsType("validatie");
      setMelding("Controleer de gemarkeerde velden.");
      formulierRef.current.elements[Object.keys(validatie.fouten)[0]]?.focus();
      return;
    }
    aanvraagBezig.current = true;
    setBezig(true);
    try {
      const antwoord = await fetch(`/api/verkopers/${verkoperId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validatie.gegevens),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setFouten(resultaat.fouten ?? {});
        setMeldingsType(antwoord.status >= 500 ? "fout" : "validatie");
        setMelding(antwoord.status >= 500 ? meldingWijzigenFout : resultaat.error ?? meldingWijzigenFout);
        return;
      }
      // De contactpersoon wordt na opslaan ook lokaal bijgewerkt, zonder het formulier te legen.
      const opgeslagenContact = { id: resultaat.contactpersoonId, naam: validatie.gegevens.contactpersoon, email: validatie.gegevens.email, telefoon: validatie.gegevens.telefoon };
      setVerkoper(vorig => ({ ...vorig, contactpersonen: vorig.contactpersonen.length
        ? vorig.contactpersonen.map(contact => contact.id === invoer.contactpersoonId ? opgeslagenContact : contact)
        : [opgeslagenContact] }));
      setInvoer({ ...validatie.gegevens, contactpersoonId: resultaat.contactpersoonId });
      setMeldingsType("succes");
      setMelding(meldingWijzigenSucces);
    } catch {
      setMeldingsType("fout");
      setMelding(meldingWijzigenFout);
    } finally {
      aanvraagBezig.current = false;
      setBezig(false);
    }
  }

  if (laadstatus === "laden") return <p role="status" className="py-12 text-center text-neutral-400">Verkoper laden…</p>;
  if (laadstatus === "niet-gevonden") return <div className="space-y-6 py-12 text-center"><h2 className="text-xl font-bold">Verkoper niet gevonden.</h2><Link href="/verkopers" className="text-orange-400 underline">Terug naar overzicht</Link></div>;
  if (laadstatus === "fout") return <div role="alert" className="space-y-6 py-12 text-center"><p className="break-words text-2xl font-extrabold tracking-widest text-orange-500">SNEAKERNESS</p><h2 className="text-xl font-bold">Er is iets misgegaan.</h2><p className="text-neutral-400">De verkoper kon niet worden geladen.</p><button type="button" onClick={probeerOpnieuw} className={knopstijl}>Probeer opnieuw</button></div>;

  return (
    <form ref={formulierRef} onSubmit={wijzigVerkoper} noValidate aria-busy={bezig} className="mx-auto max-w-4xl min-w-0 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8">
      <p className="mb-6 text-sm text-neutral-400">Velden met * zijn verplicht. Naam hoort bij de contactpersoon; bedrijfsnaam bij de verkoper.</p>
      {melding && <div role={meldingsType === "succes" ? "status" : "alert"} className="mb-6 break-words text-orange-400">
        {meldingsType === "fout" && <><p className="mb-4 text-center text-xl font-extrabold tracking-widest">SNEAKERNESS</p><h2 className="mb-2 text-center text-lg font-bold text-neutral-100">Er is iets misgegaan.</h2></>}
        <p>{melding}</p>
        {meldingsType === "fout" && <button type="submit" disabled={bezig} className={`${knopstijl} mt-4`}>Probeer opnieuw</button>}
      </div>}
      <fieldset disabled={bezig} className="min-w-0 space-y-5 disabled:opacity-70">
        {verkoper.contactpersonen.length > 1 && <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:items-center md:gap-6"><label htmlFor="contactpersoonId" className="text-sm font-semibold text-neutral-300">Contactpersoon wijzigen</label><select id="contactpersoonId" name="contactpersoonId" value={invoer.contactpersoonId} onChange={pasContactpersoonAan} className={veldstijl}>{verkoper.contactpersonen.map(contact => <option key={contact.id} value={contact.id}>{contact.naam}</option>)}</select></div>}
        {invoervelden.map(([veld, label, type, autoComplete, maximum]) => <div key={veld} className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:items-start md:gap-6">
          <label htmlFor={veld} className="text-sm font-semibold text-neutral-300 md:pt-3">{label}{veld !== "telefoon" && " *"}</label>
          <div className="min-w-0"><input id={veld} name={veld} type={type} autoComplete={autoComplete} value={invoer[veld]} onChange={pasVeldAan} required={veld !== "telefoon"} maxLength={maximum} aria-invalid={Boolean(fouten[veld])} aria-describedby={fouten[veld] ? `${veld}-fout` : undefined} className={veldstijl} />{fouten[veld] && <p id={`${veld}-fout`} className="mt-2 text-sm text-orange-400">{fouten[veld]}</p>}</div>
        </div>)}
        <p className="text-xs text-neutral-500">Contactgegevens zijn gedeeld: wijzigingen gelden ook bij andere verkopers die aan dezelfde contactpersoon gekoppeld zijn.</p>
        <div className="grid gap-3 pt-6 sm:grid-cols-2 md:ml-[calc(25%+0.375rem)]">
          <button type="submit" disabled={bezig} className={knopstijl}>{bezig ? "Bezig met opslaan…" : "Wijzigingen opslaan"}</button>
          <Link href={`/verkopers/${verkoperId}`} className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold transition hover:bg-neutral-700">Annuleren</Link>
        </div>
      </fieldset>
    </form>
  );
}
