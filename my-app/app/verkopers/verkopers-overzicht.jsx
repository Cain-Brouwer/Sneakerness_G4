"use client";

import { useEffect, useState } from "react";

const verkopertypeLabels = {
  sneakersverkoper: "Sneakersverkoper",
  "side-stand": "Side-Stand",
};

export default function VerkopersOverzicht() {
  const [verkopers, setVerkopers] = useState([]);
  const [zoekveld, setZoekveld] = useState("");
  const [actieveZoekterm, setActieveZoekterm] = useState("");
  const [verkopertype, setVerkopertype] = useState("");
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwProberenTeller, setOpnieuwProberenTeller] = useState(0);

  useEffect(() => {
    const aanvraagController = new AbortController();

    async function haalVerkopersOp() {
      const queryparameters = new URLSearchParams();

      if (actieveZoekterm) {
        queryparameters.set("zoek", actieveZoekterm);
      }

      if (verkopertype) {
        queryparameters.set("type", verkopertype);
      }

      const query = queryparameters.toString();
      const apiUrl = query ? `/api/verkopers?${query}` : "/api/verkopers";

      try {
        const antwoord = await fetch(apiUrl, {
          cache: "no-store",
          signal: aanvraagController.signal,
        });

        if (!antwoord.ok) {
          throw new Error("Verkopers ophalen mislukt");
        }

        const opgehaaldeVerkopers = await antwoord.json();
        setVerkopers(opgehaaldeVerkopers);
        setLaadstatus("klaar");
      } catch (fout) {
        if (fout.name !== "AbortError") {
          setLaadstatus("fout");
        }
      }
    }

    haalVerkopersOp();

    return () => aanvraagController.abort();
  }, [actieveZoekterm, verkopertype, opnieuwProberenTeller]);

  function pasZoekveldAan(event) {
    setZoekveld(event.target.value);
  }

  function zoekVerkopers(event) {
    event.preventDefault();
    const nieuweZoekterm = zoekveld.trim();

    setLaadstatus("laden");
    setActieveZoekterm(nieuweZoekterm);

    if (nieuweZoekterm === actieveZoekterm) {
      setOpnieuwProberenTeller((teller) => teller + 1);
    }
  }

  function pasVerkopertypeAan(event) {
    setLaadstatus("laden");
    setVerkopertype(event.target.value);
  }

  function probeerOpnieuw() {
    setLaadstatus("laden");
    setOpnieuwProberenTeller((teller) => teller + 1);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-lg">
      <div className="grid grid-cols-1 gap-4 border-b border-neutral-800 p-4 md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] md:p-6">
        <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-300">
          Filter resultaten
          <select
            value={verkopertype}
            onChange={pasVerkopertypeAan}
            className="min-h-12 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Alle verkopertypes</option>
            <option value="sneakersverkoper">Sneakersverkoper</option>
            <option value="side-stand">Side-Stand</option>
          </select>
        </label>

        <form className="flex flex-col gap-2" onSubmit={zoekVerkopers}>
          <label htmlFor="verkopers-zoekveld" className="text-sm font-semibold text-neutral-300">
            Zoekveld
          </label>
          <div className="flex min-w-0 gap-2">
            <input
              id="verkopers-zoekveld"
              type="search"
              value={zoekveld}
              onChange={pasZoekveldAan}
              placeholder="Naam, contactpersoon of e-mail"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            <button
              type="submit"
              className="min-h-12 shrink-0 rounded-lg bg-orange-600 px-4 font-bold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              Zoek
            </button>
          </div>
        </form>
      </div>

      <div className="min-h-80 p-4 md:p-6">
        {laadstatus === "laden" && <LadenStatus />}
        {laadstatus === "fout" && <FoutStatus probeerOpnieuw={probeerOpnieuw} />}
        {laadstatus === "klaar" && verkopers.length === 0 && <LegeStatus />}
        {laadstatus === "klaar" && verkopers.length > 0 && (
          <VerkoperResultaten verkopers={verkopers} />
        )}
      </div>
    </section>
  );
}

function LadenStatus() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center" role="status">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-neutral-700 border-t-orange-500" />
      <p className="text-neutral-400">Verkopers laden...</p>
    </div>
  );
}

function LegeStatus() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center text-center">
      <h2 className="text-xl font-bold text-neutral-100">Geen verkopers gevonden.</h2>
      <p className="mt-2 text-sm text-neutral-400">Pas je zoekopdracht of filter aan.</p>
    </div>
  );
}

function FoutStatus({ probeerOpnieuw }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center text-center" role="alert">
      <h2 className="text-xl font-bold text-neutral-100">Er is iets misgegaan.</h2>
      <p className="mt-2 text-sm text-neutral-400">De verkopers konden niet worden geladen.</p>
      <button
        type="button"
        onClick={probeerOpnieuw}
        className="mt-6 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        Probeer opnieuw
      </button>
    </div>
  );
}

function VerkoperResultaten({ verkopers }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-3 pb-3 font-semibold">Bedrijfsnaam</th>
              <th className="px-3 pb-3 font-semibold">Contactpersoon</th>
              <th className="px-3 pb-3 font-semibold">E-mail</th>
              <th className="px-3 pb-3 font-semibold">Telefoon</th>
              <th className="px-3 pb-3 font-semibold">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {verkopers.map((verkoper) => (
              <tr key={verkoper.id} className="transition-colors hover:bg-neutral-800/40">
                <td className="px-3 py-4 font-bold text-neutral-100">{verkoper.bedrijfsnaam}</td>
                <td className="px-3 py-4 text-neutral-300">{verkoper.contactpersoon}</td>
                <td className="px-3 py-4 text-neutral-300">{verkoper.email}</td>
                <td className="px-3 py-4 text-neutral-300">{verkoper.telefoon}</td>
                <td className="px-3 py-4">
                  <VerkopertypeLabel verkopertype={verkoper.type_verkoper} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {verkopers.map((verkoper) => (
          <article key={verkoper.id} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-neutral-100">{verkoper.bedrijfsnaam}</h2>
              <VerkopertypeLabel verkopertype={verkoper.type_verkoper} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <VerkoperGegeven label="Contactpersoon" waarde={verkoper.contactpersoon} />
              <VerkoperGegeven label="E-mail" waarde={verkoper.email} link={`mailto:${verkoper.email}`} />
              <VerkoperGegeven label="Telefoon" waarde={verkoper.telefoon} link={`tel:${verkoper.telefoon}`} />
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

function VerkopertypeLabel({ verkopertype }) {
  return (
    <span className="inline-flex rounded-full border border-orange-800 bg-orange-950/60 px-2.5 py-1 text-xs font-semibold text-orange-300">
      {verkopertypeLabels[verkopertype] ?? verkopertype}
    </span>
  );
}

function VerkoperGegeven({ label, waarde, link }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-neutral-300">
        {link ? (
          <a href={link} className="transition-colors hover:text-orange-400">
            {waarde}
          </a>
        ) : waarde}
      </dd>
    </div>
  );
}
