"use client";

// Critical app-wide error page: acts as the last fallback when the whole app crashes.
// It renders a simple, branded offline message with no layout dependency.
export default function GlobalError() {
  return (
    <html lang="nl">
      <body className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#111827,_#000_45%)] px-6 py-16 text-white">
        <main className="max-w-xl rounded-3xl border border-red-500/40 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-3xl">
            ⚠️
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
            Systeem offline
          </p>

          <h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
            De site is momenteel buiten werking
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-300" role="alert">
            Er is een kritische fout opgetreden. De applicatie is tijdelijk niet
            beschikbaar, maar de service wordt zo snel mogelijk hersteld.
          </p>
        </main>
      </body>
    </html>
  );
}
