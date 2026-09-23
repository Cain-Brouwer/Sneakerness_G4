"use client";

import { useEffect, useState } from "react";

const standtypeLabels = {
  "aa-plus": "AA+ Stand",
  aa: "AA Stand",
  a: "A Stand",
  "side-stand": "Side-Stand",
};

export default function StandsOverzicht() {
  const [stands, setStands] = useState([]);
  const [zoekterm, setZoekterm] = useState("");
  const [standtype, setStandtype] = useState("");
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwPoging, setOpnieuwPoging] = useState(0);

  useEffect(() => {
    const aanvraagController = new AbortController();

    async function haalStandsOp() {
      setLaadstatus("laden");

      const queryparameters = new URLSearchParams();

      if (zoekterm.trim()) {
        queryparameters.set("zoek", zoekterm.trim());
      }

      if (standtype) {
        queryparameters.set("type", standtype);
      }

      const query = queryparameters.toString();
      const apiUrl = query ? `/api/stands?${query}` : "/api/stands";

      try {
        const response = await fetch(apiUrl, {
          signal: aanvraagController.signal,
        });

        if (!response.ok) {
          throw new Error("STANDS_OPHALEN_MISLUKT");
        }

        const opgehaaldeStands = await response.json();
        setStands(opgehaaldeStands);
        setLaadstatus("klaar");
      } catch (fout) {
        if (fout.name !== "AbortError") {
          setStands([]);
          setLaadstatus("fout");
        }
      }
    }

    const zoekVertraging = setTimeout(haalStandsOp, 250);

    return () => {
      clearTimeout(zoekVertraging);
      aanvraagController.abort();
    };
  }, [zoekterm, standtype, opnieuwPoging]);

  function pasZoektermAan(event) {
    setZoekterm(event.target.value);
  }

  function pasStandtypeAan(event) {
    setStandtype(event.target.value);
  }

  function probeerOpnieuw() {
    setOpnieuwPoging((poging) => poging + 1);
  }

  function zoekStands(event) {
    event.preventDefault();
  }

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-lg">
      <div className="grid grid-cols-1 gap-4 border-b border-neutral-800 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-neutral-300">
          Filter resultaten
          <select
            value={standtype}
            onChange={pasStandtypeAan}
            className="min-h-12 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Alle standtypes</option>
            {Object.entries(standtypeLabels).map(([waarde, label]) => (
              <option key={waarde} value={waarde}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={zoekStands} className="min-w-0">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-neutral-300">
            Zoekveld
            <span className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="search"
                value={zoekterm}
                onChange={pasZoektermAan}
                placeholder="Zoek op standnummer"
                className="min-h-12 min-w-0 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="submit"
                className="min-h-12 rounded-xl bg-orange-600 px-6 font-bold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99]"
              >
                Zoek
              </button>
            </span>
          </label>
        </form>
      </div>

      <div
        className="min-h-80 p-4 sm:p-6"
        aria-live="polite"
        aria-busy={laadstatus === "laden"}
      >
        {laadstatus === "laden" && <LaadStatus />}
        {laadstatus === "fout" && (
          <FoutStatus probeerOpnieuw={probeerOpnieuw} />
        )}
        {laadstatus === "klaar" && stands.length === 0 && <LegeStatus />}
        {laadstatus === "klaar" && stands.length > 0 && (
          <StandResultaten stands={stands} />
        )}
      </div>
    </section>
  );
}

function LaadStatus() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-orange-500"
        aria-hidden="true"
      />
      <p className="font-medium text-neutral-300">Stands laden…</p>
    </div>
  );
}

function LegeStatus() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center text-center">
      <h2 className="text-xl font-bold text-neutral-100">Geen stands gevonden.</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Pas je zoekopdracht of filter aan.
      </p>
    </div>
  );
}

function FoutStatus({ probeerOpnieuw }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center text-center" role="alert">
      <div className="w-full max-w-xl rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-6 shadow-lg sm:px-6 sm:py-7">
        <p className="mb-5 break-words text-lg font-black tracking-[0.15em] text-orange-500 sm:mb-6 sm:text-xl sm:tracking-[0.2em]">
          SNEAKERNESS
        </p>
        <h2 className="text-lg font-bold text-neutral-100 sm:text-xl">Er is iets misgegaan.</h2>
        <p className="mt-2 text-sm text-neutral-300">
          <span className="font-mono font-bold text-orange-400">error:</span>{" "}
          De stands konden niet worden geladen.
        </p>
        <button
          type="button"
          onClick={probeerOpnieuw}
          className="mt-5 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99]"
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}

function StandResultaten({ stands }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-neutral-800 sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-950/70 text-xs uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-5 py-4 font-semibold">ID</th>
              <th className="px-5 py-4 font-semibold">Standnummer</th>
              <th className="px-5 py-4 font-semibold">Standtype</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {stands.map((stand) => (
              <tr key={stand.id} className="transition-colors hover:bg-neutral-800/40">
                <td className="px-5 py-4 text-neutral-500">#{stand.id}</td>
                <td className="px-5 py-4 text-base font-bold text-white">
                  {stand.standnummer}
                </td>
                <td className="px-5 py-4">
                  <StandtypeLabel standtype={stand.standtype} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:hidden">
        {stands.map((stand) => (
          <article
            key={stand.id}
            className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Standnummer
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {stand.standnummer}
                </h2>
              </div>
              <span className="text-xs text-neutral-600">#{stand.id}</span>
            </div>
            <div className="mt-4">
              <StandtypeLabel standtype={stand.standtype} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function StandtypeLabel({ standtype }) {
  return (
    <span className="inline-flex rounded-full border border-orange-900/70 bg-orange-950/40 px-3 py-1 text-xs font-bold text-orange-300">
      {standtypeLabels[standtype] ?? standtype}
    </span>
  );
}
