"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { koopTickets } from "./actions";

const beginState = { status: "idle", message: "", errors: {}, values: {}, bestelling: null };

const prijsFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const weekdagFormat = new Intl.DateTimeFormat("nl-NL", { weekday: "long", timeZone: "UTC" });
const korteDatumFormat = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const inputClass =
  "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 transition-colors hover:border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:opacity-40";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400";
const kaartClass =
  "rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all hover:border-neutral-700 sm:p-6";
const kaartTitelClass = "mb-4 text-lg font-bold text-orange-500";
const hintClass = "text-sm text-neutral-500";

function naarDatum(datum) {
  return new Date(`${datum}T00:00:00Z`);
}

function weekdagNaam(datum) {
  const date = naarDatum(datum);
  if (Number.isNaN(date.getTime())) return String(datum);
  const naam = weekdagFormat.format(date);
  return naam.charAt(0).toUpperCase() + naam.slice(1);
}

// Maakt de dag-knoppen op basis van de datums waarvoor nog tickets te koop zijn.
// Heeft een weekdag meerdere datums, dan zetten we de datum erbij ("Zaterdag 10 okt").
function maakDagen(tickets) {
  const datums = [...new Set(tickets.map((ticket) => ticket.Evenementdatum))].sort();
  const namen = datums.map(weekdagNaam);

  return datums.map((datum, index) => {
    const komtMeerdereKeren = namen.filter((naam) => naam === namen[index]).length > 1;
    const label = komtMeerdereKeren
      ? `${namen[index]} ${korteDatumFormat.format(naarDatum(datum))}`
      : namen[index];
    return { datum, label };
  });
}

// Tijdsloten van de gekozen dag. Een leeg tijdslot ("") betekent: geldig de hele dag.
function maakTijdsloten(tickets) {
  const sloten = [...new Set(tickets.map((ticket) => ticket.Tijdslot ?? ""))];
  sloten.sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });
  return sloten.map((waarde) => ({ waarde, label: waarde || "Hele dag" }));
}

// Totaalbedrag in euro's, berekend in centen om afrondingsverschillen te voorkomen.
function berekenTotaal(prijs, aantal) {
  const aantalGetal = Number(aantal);
  if (!prijs || !Number.isInteger(aantalGetal) || aantalGetal < 1) return 0;
  return (Math.round(prijs * 100) * aantalGetal) / 100;
}

function keuzeKnopClass(isGekozen) {
  const basis =
    "flex items-center justify-center rounded-xl px-4 py-3 text-base font-bold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40";
  return isGekozen
    ? `${basis} bg-orange-600 text-white shadow-lg hover:bg-orange-500 hover:shadow-orange-500/20`
    : `${basis} border border-neutral-700 bg-neutral-800 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-700`;
}

function Kaart({ titel, children }) {
  return (
    <section className={kaartClass}>
      <h2 className={kaartTitelClass}>{titel}</h2>
      {children}
    </section>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-fout`} className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// Het stappenplan zelf. Met een nieuwe "key" begint het opnieuw (na een gelukte bestelling).
function Stappenplan({ tickets, debug, onNieuweBestelling }) {
  const [state, formAction, isPending] = useActionState(koopTickets, beginState);
  const { errors, values } = state;

  const [gekozenDag, setGekozenDag] = useState(null);
  const [gekozenTijdslot, setGekozenTijdslot] = useState(null); // "" = hele dag
  const [gekozenTicketId, setGekozenTicketId] = useState(null);
  const [aantal, setAantal] = useState("1");

  // Stap 1: dagen. Stap 2: tijdsloten van die dag. Daarna: de tickets in dat tijdslot.
  const dagen = maakDagen(tickets);
  const ticketsOpDag = gekozenDag
    ? tickets.filter((ticket) => ticket.Evenementdatum === gekozenDag)
    : [];
  const tijdsloten = maakTijdsloten(ticketsOpDag);
  const ticketsInTijdslot =
    gekozenTijdslot === null
      ? []
      : ticketsOpDag.filter((ticket) => (ticket.Tijdslot ?? "") === gekozenTijdslot);
  const gekozenTicket = ticketsInTijdslot.find((ticket) => ticket.id === gekozenTicketId) ?? null;

  const totaal = berekenTotaal(gekozenTicket?.Prijs, aantal);

  // Een andere keuze in een eerdere stap maakt de latere keuzes weer leeg.
  function kiesDag(datum) {
    setGekozenDag(datum);
    setGekozenTijdslot(null);
    setGekozenTicketId(null);
    setAantal("1");
  }

  function kiesTijdslot(waarde) {
    setGekozenTijdslot(waarde);
    setGekozenTicketId(null);
    setAantal("1");
  }

  function kiesTicket(id) {
    setGekozenTicketId(id);
    setAantal("1");
  }

  // Zet aria-invalid en koppelt de foutmelding aan het veld
  const fieldProps = (id) => ({
    id,
    name: id,
    "aria-invalid": errors[id] ? "true" : undefined,
    "aria-describedby": errors[id] ? `${id}-fout` : undefined,
  });

  // Scenario "Ticket succesvol kopen": melding tonen en opnieuw kunnen beginnen.
  if (state.status === "success") {
    const { bestelling } = state;
    return (
      <section
        role="status"
        className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-emerald-800 bg-emerald-950/40 p-6 text-center"
      >
        <p className="text-lg font-bold text-emerald-400">{state.message}</p>
        <p className="text-sm text-neutral-300">
          {bestelling.aantal}× {bestelling.ticketnaam} voor{" "}
          {prijsFormat.format(bestelling.totaalCenten / 100)}.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onNieuweBestelling}
            className="flex items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99]"
          >
            Nog een bestelling plaatsen
          </button>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-base font-bold text-neutral-100 transition-all hover:border-neutral-500 hover:bg-neutral-700 active:scale-[0.99]"
          >
            Terug naar home
          </Link>
        </div>
      </section>
    );
  }

  // Er zijn geen tickets meer te koop
  if (dagen.length === 0) {
    return (
      <section className={kaartClass}>
        <p className="text-sm text-neutral-400">
          Er zijn op dit moment geen tickets beschikbaar.
        </p>
      </section>
    );
  }

  return (
    <form action={formAction} className="grid gap-6 md:grid-cols-[3fr_2fr] md:items-start">
      {/* Fout bij kopen van ticket (of een andere melding van de bestelling) */}
      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400 md:col-span-2"
        >
          {state.message}
        </p>
      )}

      {/* Linkerkant: de stappen 1 en 2 en de beschikbare tickets */}
      <div className="space-y-6">
        <Kaart titel="1. Dag selecteren">
          <div className="grid grid-cols-2 gap-3">
            {dagen.map((dag) => (
              <button
                key={dag.datum}
                type="button"
                aria-pressed={gekozenDag === dag.datum}
                onClick={() => kiesDag(dag.datum)}
                className={keuzeKnopClass(gekozenDag === dag.datum)}
              >
                {dag.label}
              </button>
            ))}
          </div>
        </Kaart>

        <Kaart titel="2. Tijdslot selecteren">
          {gekozenDag === null ? (
            <p className={hintClass}>Kies eerst een dag.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tijdsloten.map((slot) => (
                <button
                  key={slot.waarde}
                  type="button"
                  aria-pressed={gekozenTijdslot === slot.waarde}
                  onClick={() => kiesTijdslot(slot.waarde)}
                  className={keuzeKnopClass(gekozenTijdslot === slot.waarde)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </Kaart>

        <Kaart titel="Beschikbare tickets">
          {gekozenTijdslot === null ? (
            <p className={hintClass}>Kies eerst een tijdslot.</p>
          ) : (
            <div className="space-y-3">
              {ticketsInTijdslot.map((ticket) => {
                const isGekozen = ticket.id === gekozenTicketId;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    aria-pressed={isGekozen}
                    onClick={() => kiesTicket(ticket.id)}
                    className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                      isGekozen
                        ? "border-orange-500 bg-orange-950/40"
                        : "border-neutral-700 bg-neutral-950/60 hover:border-neutral-500 hover:bg-neutral-800/60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-bold text-white">{ticket.Ticketnaam}</span>
                      {ticket.Beschrijving && (
                        <span className="hidden text-sm text-neutral-400 md:block">
                          {ticket.Beschrijving}
                        </span>
                      )}
                      <span className="block text-xs uppercase tracking-wide text-neutral-500">
                        {ticket.Tickettype} · {ticket.AantalBeschikbaar} beschikbaar
                      </span>
                    </span>
                    <span className="shrink-0 text-lg font-bold text-orange-400">
                      {prijsFormat.format(ticket.Prijs)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.ticketId && (
            <p className="mt-3 text-xs font-medium text-red-400">{errors.ticketId}</p>
          )}
        </Kaart>
      </div>

      {/* Rechterkant: stap 3, totaal, bestelknop en toelichting */}
      <div className="space-y-4">
        <Kaart titel="3. Jouw gegevens">
          <div className="space-y-4">
            <input type="hidden" name="ticketId" value={gekozenTicketId ?? ""} />
            {debug && <input type="hidden" name="simuleerFout" value="1" />}

            <Field id="naam" label="Naam" error={errors.naam}>
              <input
                {...fieldProps("naam")}
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                disabled={!gekozenTicket}
                defaultValue={values.naam ?? ""}
                className={inputClass}
              />
            </Field>

            <Field id="email" label="E-mailadres" error={errors.email}>
              <input
                {...fieldProps("email")}
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                disabled={!gekozenTicket}
                defaultValue={values.email ?? ""}
                className={inputClass}
              />
            </Field>

            <Field id="aantal" label="Aantal tickets" error={errors.aantal}>
              <input
                {...fieldProps("aantal")}
                type="number"
                required
                min="1"
                max={gekozenTicket?.AantalBeschikbaar}
                step="1"
                inputMode="numeric"
                disabled={!gekozenTicket}
                value={aantal}
                onChange={(event) => setAantal(event.target.value)}
                className={inputClass}
              />
            </Field>

            {!gekozenTicket && <p className={hintClass}>Kies eerst een ticket.</p>}
          </div>
        </Kaart>

        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 sm:px-6">
          <span className="font-semibold text-neutral-300">Totaal</span>
          <span className="text-lg font-bold text-orange-400" aria-live="polite">
            {prijsFormat.format(totaal)}
          </span>
        </div>

        <button
          type="submit"
          disabled={!gekozenTicket || isPending}
          className="flex w-full items-center justify-center rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Bezig met bestellen…" : "Bestelling afronden"}
        </button>

        <p className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300 sm:px-6">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-500 text-xs font-bold md:hidden"
          >
            i
          </span>
          <span className="md:hidden">
            Tickets zijn digitaal en niet overdraagbaar. Bewaar je tickets goed.
          </span>
          <span className="hidden md:inline">
            Alle tickets zijn eenmalig en niet overdraagbaar.
          </span>
        </p>
      </div>
    </form>
  );
}

export default function TicketKopenFormulier({ tickets, debug = false }) {
  const [formKey, setFormKey] = useState(0);

  return (
    <Stappenplan
      key={formKey}
      tickets={tickets}
      debug={debug}
      onNieuweBestelling={() => setFormKey((huidige) => huidige + 1)}
    />
  );
}