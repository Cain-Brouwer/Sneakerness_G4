import Header from "./components/header";
import Hero from "./components/hero";
import Footer from "./components/footer";
import { getHomepageContent } from "./lib/homepage-content";

export default async function HomePage() {
  const content = getHomepageContent();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500 selection:text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        
        {/* Header */}
        <Header />

        {/* Pagina Titel */}
        <h1 className="text-center text-3xl font-extrabold uppercase tracking-widest text-neutral-400">
          {content.title}
        </h1>

        {/* Hero Section */}
        <Hero
          eventName={content.eventName}
          venue={content.venue}
          tagline={content.tagline}
        />

        {/* Hoofd CTAs (Tickets kopen / Stand huren) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="#tickets"
            className="flex items-center justify-center py-4 px-6 rounded-xl font-bold text-lg bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-lg hover:shadow-orange-500/20 active:scale-[0.99]"
          >
            Tickets kopen
          </a>
          <a
            href="#stands"
            className="flex items-center justify-center py-4 px-6 rounded-xl font-bold text-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 transition-all hover:border-neutral-500 active:scale-[0.99]"
          >
            Stand huren
          </a>
        </div>

        {/* Info & Tickets Sectie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Over het event */}
          <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-500">
                {content.aboutTitle}
              </h2>
              <p className="text-neutral-300 leading-relaxed text-sm md:text-base">
                {content.aboutText}
              </p>
            </div>
          </section>

          {/* Tickets & Toegang Tabel */}
          <section id="tickets" className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all">
            <h2 className="text-xl font-bold mb-4 text-orange-500">
              {content.ticketsTitle}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-xs">
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Prijs</th>
                    <th className="pb-3 font-semibold text-right">Beschikbaar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {content.tickets.map((ticket, index) => (
                    <tr key={index} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 font-medium text-white">{ticket.type}</td>
                      <td className="py-3 text-orange-400 font-bold">{ticket.price}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                          ticket.available === "Ja"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}>
                          {ticket.available}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Stand opties */}
        <div id="stands" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.stands.map((stand, index) => (
            <div
              key={index}
              className="group cursor-pointer bg-neutral-900/60 border border-neutral-800 hover:border-orange-500/50 p-5 rounded-xl transition-all hover:-translate-y-0.5 shadow-md"
            >
              <h3 className="font-bold text-lg text-neutral-100 group-hover:text-orange-400 transition-colors">
                {stand.name}
              </h3>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                {stand.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <Footer info={content.footerInfo} copyright={content.copyright} />
      </div>
    </div>
  );
}