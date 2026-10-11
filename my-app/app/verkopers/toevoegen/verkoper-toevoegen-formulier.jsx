"use client";

import Link from "next/link";
import ToevoegenFoutmelding from "../../components/toevoegen-foutmelding";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { valideerNieuweVerkoper } from "../../lib/verkoper-validatie";

const invoervelden = [
  ["naam", "Bedrijfsnaam", "text", "organization"],
  ["contactpersoon", "Contactpersoon", "text", "name"],
  ["email", "E-mailadres", "email", "email"],
  ["telefoon", "Telefoonnummer", "tel", "tel"],
  ["adres", "Adres", "text", "street-address"],
  ["postcode", "Postcode", "text", "postal-code"],
  ["plaats", "Plaats", "text", "address-level2"],
];
const veldstijl = "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";

export default function VerkoperToevoegenFormulier() {
  const router = useRouter();
  const [fouten, setFouten] = useState({});
  const [melding, setMelding] = useState("");
  const [serverfout, setServerfout] = useState(false);
  const [bezig, setBezig] = useState(false);
  const aanvraagBezig = useRef(false);

  async function voegVerkoperToe(event) {
    event.preventDefault();
    if (aanvraagBezig.current) return;
    const formulier = event.currentTarget;
    const invoer = Object.fromEntries(new FormData(formulier));
    invoer.dagen = Number(invoer.dagen);
    const validatie = valideerNieuweVerkoper(invoer);
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
      const antwoord = await fetch("/api/verkopers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatie.gegevens),
      });
      const resultaat = await antwoord.json();
      if (!antwoord.ok) {
        setServerfout(antwoord.status >= 500);
        setFouten(resultaat.fouten ?? {});
        setMelding(resultaat.error ?? "De verkoper kon niet worden toegevoegd. Probeer opnieuw.");
        return;
      }
      // Het overzicht haalt de nieuw opgeslagen verkoper via de API op.
      router.push("/verkopers");
      router.refresh();
    } catch {
      setServerfout(true);
      setMelding("De verkoper kon niet worden toegevoegd. Probeer opnieuw.");
    } finally {
      aanvraagBezig.current = false;
      setBezig(false);
    }
  }

  function toonVeldfout(veld) {
    return fouten[veld] ? <p id={`${veld}-fout`} className="mt-2 text-sm text-red-400">{fouten[veld]}</p> : null;
  }

  return (
    <form onSubmit={voegVerkoperToe} noValidate className="mx-auto max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg sm:p-8" aria-busy={bezig}>
      <p className="mb-6 text-sm text-neutral-400">Velden met * zijn verplicht.</p>
      {melding && (serverfout
        ? <ToevoegenFoutmelding melding={melding} bezig={bezig} />
        : <p role="alert" className="mb-6 text-orange-400">{melding}</p>)}
      <fieldset disabled={bezig} className="min-w-0 space-y-5 disabled:opacity-70">
        {invoervelden.map(([veld, label, type, autoComplete]) => (
          <div key={veld}>
            <label htmlFor={veld} className="text-sm font-semibold text-neutral-300">{label}{veld !== "telefoon" && " *"}</label>
            <input id={veld} name={veld} type={type} autoComplete={autoComplete} required={veld !== "telefoon"} maxLength={veld === "email" ? 254 : veld === "adres" ? 200 : veld === "telefoon" ? 30 : veld === "postcode" ? 20 : veld === "plaats" ? 100 : 150} className={veldstijl} aria-invalid={Boolean(fouten[veld])} aria-describedby={fouten[veld] ? `${veld}-fout` : undefined} />
            {toonVeldfout(veld)}
          </div>
        ))}
        <div>
          <label htmlFor="verkooptSoort" className="text-sm font-semibold text-neutral-300">Categorie / Type verkoper *</label>
          <input id="verkooptSoort" name="verkooptSoort" list="verkoopsoorten" required maxLength={100} className={veldstijl} aria-invalid={Boolean(fouten.verkooptSoort)} aria-describedby={fouten.verkooptSoort ? "verkooptSoort-fout" : undefined} />
          {/* Suggesties houden de categorielijst open voor andere verkoopsoorten. */}
          <datalist id="verkoopsoorten">
            {["Sneakers", "Eten en Drinken", "Kids Corner", "Streetwear", "Accessoires"].map((soort) => <option key={soort} value={soort} />)}
          </datalist>
          {toonVeldfout("verkooptSoort")}
        </div>
        <div>
          <label htmlFor="dagen" className="text-sm font-semibold text-neutral-300">Aantal dagen *</label>
          <select id="dagen" name="dagen" defaultValue="" required className={veldstijl} aria-invalid={Boolean(fouten.dagen)} aria-describedby={fouten.dagen ? "dagen-fout" : undefined}>
            <option value="" disabled>Kies het aantal dagen</option>
            <option value="1">1 dag</option>
            <option value="2">2 dagen</option>
          </select>
          {toonVeldfout("dagen")}
        </div>
        <div>
          <label htmlFor="opmerking" className="text-sm font-semibold text-neutral-300">Opmerkingen</label>
          <textarea id="opmerking" name="opmerking" rows={4} maxLength={2000} className={`${veldstijl} resize-y`} aria-invalid={Boolean(fouten.opmerking)} aria-describedby={fouten.opmerking ? "opmerking-fout" : undefined} />
          {toonVeldfout("opmerking")}
        </div>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <button type="submit" className="min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-500 disabled:cursor-wait">{bezig ? "Bezig met toevoegen…" : "Verkoper Toevoegen"}</button>
          <Link href="/verkopers" className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-3 font-bold transition hover:bg-neutral-700">Annuleren</Link>
        </div>
      </fieldset>
    </form>
  );
}
