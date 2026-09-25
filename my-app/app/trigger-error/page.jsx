// Test page for forcing a runtime error intentionally.
// This is only triggered when a debug flag is explicitly enabled, so the production build stays stable.
export default function TriggerErrorPage({ searchParams }) {
  const shouldCrash = searchParams?.debug === '1' || process.env.NEXT_PUBLIC_TRIGGER_ERROR === 'true';

  if (shouldCrash) {
    throw new Error('Handmatig getriggerde outage voor testdoeleinden');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070b] px-6 py-16 text-white">
      <div className="max-w-xl rounded-3xl border border-orange-500/40 bg-white/5 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
          Testpagina
        </p>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">Error route is veilig</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-300">
          Deze pagina is normaal werkbaar. Voeg <strong>?debug=1</strong> toe of zet
          <strong> NEXT_PUBLIC_TRIGGER_ERROR=true</strong> om de fout intentionally te triggeren.
        </p>
      </div>
    </main>
  );
}
