// Footer component: shows the final event info blocks at the bottom of the page.
// It keeps the contact/location details and copyright text in a consistent layout.
export default function Footer({ info, copyright }) {
  return (
    <footer
      id="info"
      className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] pt-4"
    >
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-4 text-center text-xs text-neutral-400">
        <h2 className="mb-1 font-bold text-neutral-200 uppercase tracking-wider">Info</h2>
        <p>{info}</p>
      </section>
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-4 text-center text-xs text-neutral-400">
        <h2 className="mb-1 font-bold text-neutral-200 uppercase tracking-wider">Copyrights</h2>
        <p>{copyright}</p>
      </section>
    </footer>
  );
}