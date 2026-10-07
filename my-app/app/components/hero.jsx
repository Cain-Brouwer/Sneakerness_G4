export default function Hero({ eventName, venue, tagline }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl px-6 py-12 text-center md:py-16 shadow-xl">
      {/* Subtiel decoratief verloop-effect op de achtergrond */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-orange-500/10 blur-3xl pointer-events-none" />

      <h2 className="relative text-3xl font-extrabold tracking-tight text-white md:text-5xl">
        {eventName}
        <span className="hidden md:inline text-orange-500">{` - ${venue}`}</span>
      </h2>
      <p className="relative mt-4 text-base font-medium text-neutral-400 md:text-lg max-w-xl mx-auto">
        {tagline}
      </p>
    </section>
  );
}