export default function ToevoegenFoutmelding({ melding, bezig }) {
  return (
    <div role="alert" className="mb-8 min-w-0 py-6 text-center sm:py-10">
      <p className="break-words text-2xl font-extrabold tracking-widest text-orange-500 sm:text-3xl">SNEAKERNESS</p>
      <h2 className="mt-8 text-xl font-bold text-neutral-100 sm:text-2xl">Er is iets misgegaan.</h2>
      <p className="mt-4 break-words text-neutral-400"><span className="font-mono font-bold text-orange-500">error:</span> {melding}</p>
      {/* Opnieuw versturen behoudt de ingevulde formuliergegevens. */}
      <button type="submit" disabled={bezig} className="mt-8 min-h-12 rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-wait disabled:opacity-70">
        {bezig ? "Bezig met toevoegen…" : "Probeer opnieuw"}
      </button>
    </div>
  );
}
