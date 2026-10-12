'use client'; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import Header from "../components/header";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";
  const detail = isDev && error?.message ? error.message : null;

  return (
    <>
      <Header />

      <section className="relative overflow-hidden bg-neutral-900/60 border border-red-900/60 rounded-2xl px-6 py-16 text-center shadow-xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-red-600/10 blur-3xl pointer-events-none" />
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Geen verbinding met de database
        </h1>
        <p className="relative mt-4 text-base font-medium text-neutral-400 md:text-lg max-w-xl mx-auto">
          We kunnen de contactpersonen momenteel niet ophalen. Probeer het opnieuw of ga terug naar de homepagina.
        </p>

        {detail && (
          <p className="relative mt-4 mx-auto max-w-xl break-all text-xs text-red-400/80 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
            {detail}
          </p>
        )}

        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto py-4 px-6 rounded-xl font-bold text-lg bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-lg hover:shadow-orange-500/20 active:scale-[0.99]"
          >
            Opnieuw proberen
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center py-4 px-6 rounded-xl font-bold text-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 transition-all hover:border-neutral-500 active:scale-[0.99]"
          >
            Terug naar home
          </Link>
        </div>
      </section>
    </>
  );
}
