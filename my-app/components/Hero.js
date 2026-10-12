export default function Hero({ eventName, venue, tagline }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),transparent_48%)] p-6 shadow-lg md:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_55%)]" aria-hidden="true" />
      <div className="relative space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" aria-hidden="true" />
          Sneaker event
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black uppercase tracking-wider text-white md:text-5xl">
            {eventName}
          </h2>
          <p className="max-w-2xl text-base text-neutral-300 md:text-lg">{tagline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
          <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1.5">
            {venue}
          </span>
          <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1.5">
            Rotterdam
          </span>
        </div>
      </div>
    </section>
  );
}
