"use client";

import { useActionState } from "react";
import Link from "next/link";
import { annuleerTicket } from "./actions";

const beginState = { status: "idle", message: "" };

export default function TicketAnnulerenFormulier({ ticketId }) {
  // .bind geeft het id van het ticket mee aan de server action
  const [state, formAction, isPending] = useActionState(
    annuleerTicket.bind(null, ticketId),
    beginState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* Meldingen: succes of fout */}
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

      {state.status === "success" ? (
        // Na het annuleren is er niets meer te bevestigen: alleen nog terug naar het overzicht
        <Link
          href="/tickets"
          className="flex items-center justify-center rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99]"
        >
          Terug naar overzicht
        </Link>
      ) : (
        <>
          <p className="text-sm text-neutral-300">
            Weet je zeker dat je dit ticket wilt annuleren?
          </p>

          {/* Knoppen: naast elkaar op desktop, onder elkaar op mobiel */}
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Bezig met annuleren…" : "Bevestigen"}
            </button>
            {/* "Terug" annuleert niets: het ticket blijft geldig */}
            <Link
              href="/tickets"
              className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-4 text-lg font-bold text-neutral-100 transition-all hover:border-neutral-500 hover:bg-neutral-700 active:scale-[0.99]"
            >
              Terug
            </Link>
          </div>
        </>
      )}
    </form>
  );
}