"use client";

// Error boundary fallback page: shown when a page fails during runtime.
// It logs the issue and gives the user a way to retry or reload the app.
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Sneakerness app error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_#111827,_#000_45%)] px-6 py-16">
      <div className="max-w-xl rounded-3xl border border-red-500/40 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-3xl">
          ⚠️
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
          Systeem offline
        </p>

        <h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
          De site is momenteel buiten werking
        </h1>

        <p className="mt-4 text-base leading-relaxed text-zinc-300">
          Er is een onverwachte fout opgetreden. De pagina is tijdelijk niet
          beschikbaar, maar we werken eraan om de service weer online te krijgen.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset?.()}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Probeer opnieuw
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Vernieuw de pagina
          </button>
        </div>
      </div>
    </main>
  );
}
