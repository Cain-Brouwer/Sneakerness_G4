"use client";

import Link from "next/link";
import ToevoegenFoutmelding from "../../components/error-handling/toevoegen-foutmelding.jsx";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { standtypes, valideerNieuweStand } from "../../../lib/stand-validatie";

const veldstijl = "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";

export default function StandToevoegenFormulier() {
  const router = useRouter();
  const [fouten, setFouten] = useState({});
  const [melding, setMelding] = useState("");
  const [serverfout, setServerfout] = useState(false);
  const [bezig, setBezig] = useState(false);
  const aanvraagBezig = useRef(false);

  async function voegStandToe(event) {
    event.preventDefault();
    if (aanvraagBezig.current) return;
    const formulier = event.currentTarget;
    const invoer = Object.fromEntries(new FormData(formulier));
    invoer.grootte = Number(invoer.grootte.replace(",", "."));
    const validatie = valideerNieuweStand(invoer);
    setFouten(validatie.fouten);
    setMelding("");
    setServerfout(false);
    if (Object.keys(validatie.fouten).length) {
      setMelding("Vul de ontbrekende gegevens in en controleer de gemarkeerde velden.");
      formulier.elements[Object.keys(validatie.fouten)[0]]?.focus();
      return;
    }
    aanvraagBezig.current = true;
    setBezig(true);
    try {
      const antwoord = await fetch("/api/stands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoer),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setServerfout(antwoord.status >= 500);
        setFouten(resultaat.fouten ?? {});
        setMelding(resultaat.error ?? "De stand kon niet worden toegevoegd. Probeer opnieuw.");
        return;
      }
      // Het overzicht haalt de nieuwe stand opnieuw via de API op.
      router.push("/stands");
      router.refresh();
    } catch {
      setServerfout(true);
      setMelding("De stand kon niet worden toegevoegd. Probeer opnieuw.");
    } finally {
      aanvraagBezig.current = false;
      setBezig(false);
    }
  }

  function toonVeldfout(veld) {
    return fouten[veld] ? <p id={`${veld}-fout`} className="mt-2 text-sm text-red-400">{fouten[veld]}</p> : null;
  }

  function leesToegankelijkheid(veld) {
    return { "aria-invalid": Boolean(fouten[veld]), "aria-describedby": fouten[veld] ? `${veld}-fout` : undefined };
  }

  return (
    <form onSubmit={voegStandToe} noValidate aria-busy={bezig} className="mx-auto max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8">
      <p className="mb-6 text-sm text-neutral-400">Velden met * zijn verplicht.</p>
      {melding && (serverfout
        ? <ToevoegenFoutmelding melding={melding} bezig={bezig} />
        : <p role="alert" className="mb-6 text-orange-400">{melding}</p>)}
      <fieldset disabled={bezig} className="min-w-0 space-y-5 disabled:opacity-70">
        <div>
          <label htmlFor="standnummer" className="text-sm font-semibold text-neutral-300">Standnummer *</label>
          <input id="standnummer" name="standnummer" required maxLength={50} className={veldstijl} {...leesToegankelijkheid("standnummer")} />
          {toonVeldfout("standnummer")}
        </div>
        <div>
          <label htmlFor="standtype" className="text-sm font-semibold text-neutral-300">Standtype *</label>
          <select id="standtype" name="standtype" defaultValue="" required className={veldstijl} {...leesToegankelijkheid("standtype")}>
            <option value="" disabled>Kies een standtype</option>
            {Object.entries(standtypes).map(([waarde, label]) => <option key={waarde} value={waarde}>{label}</option>)}
          </select>
          {toonVeldfout("standtype")}
        </div>
        <div>
          <label htmlFor="locatie" className="text-sm font-semibold text-neutral-300">Locatie / Hal *</label>
          <input id="locatie" name="locatie" required maxLength={150} className={veldstijl} {...leesToegankelijkheid("locatie")} />
          {toonVeldfout("locatie")}
        </div>
        <div>
          <label htmlFor="grootte" className="text-sm font-semibold text-neutral-300">Grootte (m²) *</label>
          <input id="grootte" name="grootte" inputMode="decimal" required className={veldstijl} {...leesToegankelijkheid("grootte")} />
          {toonVeldfout("grootte")}
        </div>
        <div>
          <label htmlFor="prijs" className="text-sm font-semibold text-neutral-300">Prijs (€)</label>
          <input id="prijs" name="prijs" inputMode="decimal" className={veldstijl} {...leesToegankelijkheid("prijs")} />
          {toonVeldfout("prijs")}
        </div>
        <div>
          <label htmlFor="status" className="text-sm font-semibold text-neutral-300">Status *</label>
          <input id="status" name="status" list="standstatussen" defaultValue="Beschikbaar" required maxLength={50} className={veldstijl} {...leesToegankelijkheid("status")} />
          <datalist id="standstatussen"><option value="Beschikbaar" /></datalist>
          {toonVeldfout("status")}
        </div>
        <div>
          <label htmlFor="opmerking" className="text-sm font-semibold text-neutral-300">Opmerkingen / Omschrijving</label>
          <textarea id="opmerking" name="opmerking" rows={4} maxLength={2000} className={`${veldstijl} resize-y`} {...leesToegankelijkheid("opmerking")} />
          {toonVeldfout("opmerking")}
        </div>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <button type="submit" className="min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 disabled:cursor-wait">{bezig ? "Bezig met toevoegen…" : "Stand Toevoegen"}</button>
          <Link href="/stands" className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold transition hover:bg-neutral-700">Annuleren</Link>
        </div>
      </fieldset>
    </form>
  );
}
