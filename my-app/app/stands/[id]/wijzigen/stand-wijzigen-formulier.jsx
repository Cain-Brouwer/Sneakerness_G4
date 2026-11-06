"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { valideerStandWijziging, meldingStandWijzigenSucces, meldingStandWijzigenFout } from "../../../../lib/stand-wijzigen-validatie.js";

const veldstijl = "min-h-12 w-full min-w-0 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";
const knopstijl = "min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-wait disabled:opacity-60";
const rijstijl = "grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:items-start md:gap-6";
const invoervelden = [["standnummer", "Standnummer", 50], ["locatie", "Hal / Locatie", 150], ["grootte", "Afmeting (m²)"], ["prijs", "Prijs (€)"]];

export default function StandWijzigenFormulier({ standId }) {
  const [stand, setStand] = useState(null);
  const [verkopers, setVerkopers] = useState([]);
  const [invoer, setInvoer] = useState({ standnummer: "", verkoperId: "", locatie: "", grootte: "", prijs: "" });
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwPoging, setOpnieuwPoging] = useState(0);
  const [melding, setMelding] = useState("");
  const [meldingsType, setMeldingsType] = useState("");
  const [fouten, setFouten] = useState({});
  const [conflict, setConflict] = useState(false);
  const [bezig, setBezig] = useState(false);
  const aanvraagBezig = useRef(false);
  const formulierRef = useRef(null);

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
        setVerkopers(gegevens.verkopers);
        setInvoer({
          standnummer: gegevens.stand.standnummer, verkoperId: gegevens.stand.verkoperId === null ? "" : String(gegevens.stand.verkoperId),
          locatie: gegevens.stand.locatie ?? "", grootte: gegevens.stand.grootte === null ? "" : String(gegevens.stand.grootte),
          prijs: gegevens.stand.prijsCenten === null ? "" : (gegevens.stand.prijsCenten / 100).toFixed(2).replace(".", ","),
        });
        setMelding("");
        setFouten({});
        setConflict(false);
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
  function pasVeldAan(event) {
    const { name, value } = event.target;
    setInvoer(vorig => ({ ...vorig, [name]: value }));
    setMelding("");
  }

  async function wijzigStand(event) {
    event.preventDefault();
    if (aanvraagBezig.current) return;
    const gegevens = {
      ...invoer, grootte: Number(invoer.grootte.replace(",", ".")),
      verkoperId: invoer.verkoperId === "" ? null : Number(invoer.verkoperId),
      verwachteVerkoperId: stand.verkoperId,
    };
    const validatie = valideerStandWijziging(gegevens);
    setFouten(validatie.fouten);
    setMelding("");
    setConflict(false);
    if (Object.keys(validatie.fouten).length) {
      setMeldingsType("validatie");
      setMelding("Controleer de gemarkeerde velden.");
      formulierRef.current.elements[Object.keys(validatie.fouten)[0]]?.focus();
      return;
    }
    aanvraagBezig.current = true;
    setBezig(true);
    try {
      const antwoord = await fetch(`/api/stands/${standId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(gegevens),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setFouten(resultaat.fouten ?? {});
        setConflict(antwoord.status === 409 && !resultaat.fouten);
        setMeldingsType(antwoord.status >= 500 ? "fout" : "validatie");
        setMelding(antwoord.status >= 500 ? meldingStandWijzigenFout : resultaat.error ?? meldingStandWijzigenFout);
        return;
      }
      // Actualiseert de verwachte koppeling voor een volgende wijziging.
      setStand(vorig => ({ ...vorig, verkoperId: resultaat.verkoperId, status: resultaat.status }));
      setInvoer(vorig => ({ ...vorig, standnummer: validatie.gegevens.standnummer, locatie: validatie.gegevens.locatie }));
      setMeldingsType("succes");
      setMelding(meldingStandWijzigenSucces);
    } catch {
      setMeldingsType("fout");
      setMelding(meldingStandWijzigenFout);
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

  if (laadstatus === "laden") return <p role="status" className="py-12 text-center text-neutral-400">Stand laden…</p>;
  if (laadstatus === "niet-gevonden") return <div className="space-y-6 py-12 text-center"><h2 className="text-xl font-bold">Stand niet gevonden.</h2><Link href="/stands" className="text-orange-400 underline">Terug naar overzicht</Link></div>;
  if (laadstatus === "fout") return <div role="alert" className="space-y-6 py-12 text-center"><p className="break-words text-2xl font-extrabold tracking-widest text-orange-500">SNEAKERNESS</p><h2 className="text-xl font-bold">Er is iets misgegaan.</h2><p className="text-neutral-400">De standgegevens konden niet worden geladen.</p><button type="button" onClick={probeerOpnieuw} className={knopstijl}>Probeer opnieuw</button></div>;

  return (
    <form ref={formulierRef} onSubmit={wijzigStand} noValidate aria-busy={bezig} className="mx-auto max-w-4xl min-w-0 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8">
      <p className="mb-6 text-sm text-neutral-400">Velden met * zijn verplicht.</p>
      {melding && <div role={meldingsType === "succes" ? "status" : "alert"} className="mb-6 break-words text-orange-400">
        {meldingsType === "fout" && <><p className="mb-4 text-center text-xl font-extrabold tracking-widest">SNEAKERNESS</p><h2 className="mb-2 text-center text-lg font-bold text-neutral-100">Er is iets misgegaan.</h2></>}
        <p>{melding}</p>
        {meldingsType === "fout" && <button type="submit" disabled={bezig} className={`${knopstijl} mt-4`}>Probeer opnieuw</button>}
        {conflict && <button type="button" disabled={bezig} onClick={probeerOpnieuw} className={`${knopstijl} mt-4`}>Gegevens opnieuw laden</button>}
      </div>}
      <fieldset disabled={bezig} className="min-w-0 space-y-5 disabled:opacity-70">
        {invoervelden.map(([veld, label, maximum], index) => <div key={veld}>
          <div className={rijstijl}>
            <label htmlFor={veld} className="text-sm font-semibold text-neutral-300 md:pt-3">{label}{veld !== "prijs" && " *"}</label>
            <div className="min-w-0"><input id={veld} name={veld} type="text" inputMode={["grootte", "prijs"].includes(veld) ? "decimal" : undefined} value={invoer[veld]} onChange={pasVeldAan} required={veld !== "prijs"} maxLength={maximum} className={veldstijl} {...leesToegankelijkheid(veld)} />{toonVeldfout(veld)}</div>
          </div>
          {index === 0 && <div className={`${rijstijl} mt-5`}>
            <label htmlFor="verkoperId" className="text-sm font-semibold text-neutral-300 md:pt-3">Verkoper</label>
            <div className="min-w-0"><select id="verkoperId" name="verkoperId" value={invoer.verkoperId} onChange={pasVeldAan} className={veldstijl} {...leesToegankelijkheid("verkoperId")}><option value="">Geen verkoper</option>{verkopers.map(verkoper => <option key={verkoper.id} value={verkoper.id}>{verkoper.naam}{!verkoper.isactief && " (inactief)"}</option>)}</select>{toonVeldfout("verkoperId")}</div>
          </div>}
        </div>)}
        <p className="text-xs text-neutral-500">Huidige status: {stand.status}. Een nieuwe verkoperkoppeling reserveert de beschikbare stand. Bestaande reserveringsdatums blijven behouden; een lopende reservering kun je hier niet annuleren.</p>
        <div className="grid gap-3 pt-6 sm:grid-cols-2 md:ml-[calc(25%+0.375rem)]">
          <button type="submit" disabled={bezig} className={knopstijl}>{bezig ? "Bezig met opslaan…" : "Wijzigingen opslaan"}</button>
          <Link href="/stands" onClick={event => { if (bezig) event.preventDefault(); }} aria-disabled={bezig} className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold transition hover:bg-neutral-700">Annuleren</Link>
        </div>
      </fieldset>
    </form>
  );
}
