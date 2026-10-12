"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addTicket } from "./actions";

const beginState = { status: "idle", message: "", errors: {}, values: {} };

const inputClass =
  "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 transition-colors hover:border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400";

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

export default function TicketForm({ ticketTypes }) {
  const [state, formAction, isPending] = useActionState(addTicket, beginState);
  const { errors, values } = state;

  // Zet aria-invalid en koppelt de foutmelding aan het veld
  const fieldProps = (id) => ({
    id,
    name: id,
    "aria-invalid": errors[id] ? "true" : undefined,
    "aria-describedby": errors[id] ? `${id}-fout` : undefined,
  });

  return (
    <section className="mx-auto w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all hover:border-neutral-700 sm:p-6">
      <form action={formAction} className="space-y-4">
        {/* Meldingen: succes of systeemfout */}
        {state.status === "success" && (
          <p
            role="status"
            className="rounded-lg border border-emerald-800 bg-emerald-950 px-4 py-3 text-sm font-semibold text-emerald-400"
          >
            {state.message}
          </p>
        )}
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400"
          >
            {state.message}
          </p>
        )}

        <Field id="ticketnaam" label="Ticketnaam" error={errors.ticketnaam}>
          <input
            {...fieldProps("ticketnaam")}
            type="text"
            required
            maxLength={100}
            defaultValue={values.ticketnaam ?? ""}
            className={inputClass}
          />
        </Field>

        <Field id="tickettypeId" label="Tickettype" error={errors.tickettypeId}>
          <div className="relative">
            <select
              key={values.tickettypeId ?? ""}
              {...fieldProps("tickettypeId")}
              required
              defaultValue={values.tickettypeId ?? ""}
              className={`${inputClass} appearance-none pr-10`}
            >
              <option value="" disabled>
                Kies een tickettype
              </option>
              {ticketTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.Naam}
                </option>
              ))}
            </select>
            {/* Pijltje van de dropdown, zoals in de wireframe */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </div>
        </Field>

        <Field id="prijs" label="Prijs (€)" error={errors.prijs}>
          <input
            {...fieldProps("prijs")}
            type="number"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={values.prijs ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          id="aantalBeschikbaar"
          label="Aantal beschikbaar"
          error={errors.aantalBeschikbaar}
        >
          <input
            {...fieldProps("aantalBeschikbaar")}
            type="number"
            required
            min="0"
            step="1"
            inputMode="numeric"
            defaultValue={values.aantalBeschikbaar ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          id="evenementdatum"
          label="Evenementdatum"
          error={errors.evenementdatum}
        >
          <input
            {...fieldProps("evenementdatum")}
            type="date"
            required
            defaultValue={values.evenementdatum ?? ""}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </Field>

        <Field id="beschrijving" label="Beschrijving" error={errors.beschrijving}>
          <textarea
            {...fieldProps("beschrijving")}
            rows={4}
            maxLength={500}
            defaultValue={values.beschrijving ?? ""}
            className={`${inputClass} resize-y`}
          />
        </Field>

        {/* Knoppen: naast elkaar op desktop, onder elkaar op mobiel */}
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center rounded-xl bg-orange-600 px-6 py-4 text-lg! font-bold! text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Bezig met opslaan…" : "Ticket opslaan"}
          </button>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4 text-lg font-bold text-neutral-100 transition-all hover:border-neutral-500 hover:bg-neutral-700 active:scale-[0.99]"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </section>
  );
}