export default function Footer({
  info = "Sneakerness Rotterdam",
  copyright = "© Sneakerness Rotterdam",
}) {
  return (
    <footer
      id="info"
      className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
    >
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-5 py-4 text-center text-xs text-neutral-400">
        <h2 className="mb-1 font-bold uppercase tracking-wider text-neutral-200">
          Info
        </h2>
        <p>{info}</p>
      </section>
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-5 py-4 text-center text-xs text-neutral-400">
        <h2 className="mb-1 font-bold uppercase tracking-wider text-neutral-200">
          Copyrights
        </h2>
        <p>{copyright}</p>
      </section>
    </footer>
  );
}
