"use client";

import { useEffect, useState } from "react";

export default function VerkopersOverzicht() {
  const [verkopers, setVerkopers] = useState([]);
  const [zoekveld, setZoekveld] = useState("");
  const [actieveZoekterm, setActieveZoekterm] = useState("");
  const [dagen, setDagen] = useState("");
  const [specialeStatus, setSpecialeStatus] = useState("");
  const [laadstatus, setLaadstatus] = useState("laden");
  const [opnieuwProberenTeller, setOpnieuwProberenTeller] = useState(0);

  useEffect(() => {
    const aanvraagController = new AbortController();

    async function haalVerkopersOp() {
      const queryparameters = new URLSearchParams();

      if (actieveZoekterm) {
        queryparameters.set("zoek", actieveZoekterm);
      }

      if (dagen) {
        queryparameters.set("dagen", dagen);
      }

      if (specialeStatus) {
        queryparameters.set("specialeStatus", specialeStatus);
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
  }, [actieveZoekterm, dagen, specialeStatus, opnieuwProberenTeller]);

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

  function pasAantalDagenAan(event) {
    setLaadstatus("laden");
    setDagen(event.target.value);
  }

  function pasSpecialeStatusAan(event) {
    setLaadstatus("laden");
    setSpecialeStatus(event.target.value);
  }

  function probeerOpnieuw() {
    setLaadstatus("laden");
    setOpnieuwProberenTeller((teller) => teller + 1);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-lg">
      <div className="border-b border-neutral-800 p-4 md:p-6">
        <form onSubmit={zoekVerkopers}>
          <fieldset>
            <legend className="mb-4 text-sm font-semibold text-neutral-300">
              Filter resultaten
            </legend>

            <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_minmax(18rem,1.6fr)]">
              <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-neutral-400">
                Aantal dagen
                <select
                  value={dagen}
                  onChange={pasAantalDagenAan}
                  className="min-h-12 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Alle dagen</option>
                  <option value="1">1 dag</option>
                  <option value="2">2 dagen</option>
                </select>
              </label>

              <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-neutral-400">
                Speciale status
                <select
                  value={specialeStatus}
                  onChange={pasSpecialeStatusAan}
                  className="min-h-12 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm text-neutral-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Alle statussen</option>
                  <option value="true">Partner</option>
                  <option value="false">Standaard</option>
                </select>
              </label>

              <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-neutral-400">
                Zoekveld
                <span className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    id="verkopers-zoekveld"
                    type="search"
                    value={zoekveld}
                    onChange={pasZoekveldAan}
                    placeholder="Naam of verkoopsoort"
                    className="min-h-12 min-w-0 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm font-normal text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="submit"
                    className="min-h-12 w-full rounded-lg bg-orange-600 px-5 font-bold text-white transition-colors hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 sm:w-auto"
                  >
                    Zoek
                  </button>
                </span>
              </label>
            </div>
          </fieldset>
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
      <p className="mb-6 text-xl font-black tracking-[0.2em] text-orange-500">
        SNEAKERNESS
      </p>
      <h2 className="text-xl font-bold text-neutral-100">Er is iets misgegaan.</h2>
      <p className="mt-2 text-sm text-neutral-400">
        <span className="font-mono font-bold text-orange-400">error:</span>{" "}
        De verkopers konden niet worden geladen.
      </p>
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
              <th className="px-3 pb-3 font-semibold">Naam</th>
              <th className="px-3 pb-3 font-semibold">Verkoopt</th>
              <th className="px-3 pb-3 font-semibold">Dagen</th>
              <th className="px-3 pb-3 font-semibold">Status</th>
              <th className="px-3 pb-3 font-semibold">Logo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {verkopers.map((verkoper) => (
              <tr key={verkoper.id} className="transition-colors hover:bg-neutral-800/40">
                <td className="px-3 py-4 font-bold text-neutral-100">{verkoper.naam}</td>
                <td className="px-3 py-4 text-neutral-300">{verkoper.verkooptSoort}</td>
                <td className="px-3 py-4 text-neutral-300">{formatteerDagen(verkoper.dagen)}</td>
                <td className="px-3 py-4">
                  <SpecialeStatusLabel specialeStatus={verkoper.specialeStatus} />
                </td>
                <td className="px-3 py-4">
                  <LogoLink logo={verkoper.logo} />
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
              <h2 className="text-lg font-bold text-neutral-100">{verkoper.naam}</h2>
              <SpecialeStatusLabel specialeStatus={verkoper.specialeStatus} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <VerkoperGegeven label="Verkoopt" waarde={verkoper.verkooptSoort} />
              <VerkoperGegeven label="Dagen" waarde={formatteerDagen(verkoper.dagen)} />
              {verkoper.logo && (
                <VerkoperGegeven label="Logo" waarde={<LogoLink logo={verkoper.logo} />} />
              )}
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

function formatteerDagen(dagen) {
  return dagen === 1 ? "1 dag" : `${dagen} dagen`;
}

function SpecialeStatusLabel({ specialeStatus }) {
  const stijl = specialeStatus
    ? "border-orange-800 bg-orange-950/60 text-orange-300"
    : "border-neutral-700 bg-neutral-900 text-neutral-400";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${stijl}`}>
      {specialeStatus ? "Partner" : "Standaard"}
    </span>
  );
}

function LogoLink({ logo }) {
  if (!logo) {
    return <span className="text-neutral-600">—</span>;
  }

  return (
    <a
      href={logo}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-orange-400 transition-colors hover:text-orange-300"
    >
      Logo bekijken
    </a>
  );
}

function VerkoperGegeven({ label, waarde }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-neutral-300">{waarde}</dd>
    </div>
  );
}
