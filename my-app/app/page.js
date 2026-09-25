import Header from '../components/Header';
import Footer from '../components/Footer';

const tickets = [
  { time: '11:00', price: '€ 25,00', availability: '48 beschikbaar' },
  { time: '12:00', price: '€ 25,00', availability: '12 beschikbaar' },
  { time: '14:00', price: '€ 30,00', availability: 'Uitverkocht' },
  { time: '16:00', price: '€ 25,00', availability: '32 beschikbaar' },
];

function TicketTable() {
  return (
    <section className="mx-auto mt-10 max-w-[1200px] border border-white/70 bg-[#090d11] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="border-b border-white/70 px-6 py-4 text-left text-[2.3rem] font-black tracking-tight text-zinc-100 md:px-8">
        Beschikbare tijdsloten
      </div>

      <div className="overflow-hidden">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#0d1117] text-xl font-semibold text-zinc-100 md:text-2xl">
              <th className="border-r border-white/60 px-4 py-5 md:px-6">Tijd</th>
              <th className="border-r border-white/60 px-4 py-5 md:px-6">Prijs</th>
              <th className="px-4 py-5 md:px-6">Beschikbaarheid</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket, index) => (
              <tr
                key={ticket.time}
                className={index % 2 === 0 ? 'bg-[#070a0e]' : 'bg-[#0b0f13]'}
              >
                <td className="border-t border-r border-white/60 px-4 py-5 text-xl text-zinc-100 md:px-6 md:text-3xl">
                  {ticket.time}
                </td>
                <td className="border-t border-r border-white/60 px-4 py-5 text-xl text-zinc-100 md:px-6 md:text-3xl">
                  {ticket.price}
                </td>
                <td className="border-t border-white/60 px-4 py-5 text-xl text-zinc-100 md:px-6 md:text-3xl">
                  {ticket.availability}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#05070b] text-zinc-100">
      <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-5 lg:px-8">
        <Header />

        <section className="mt-8 border border-white/10 bg-[#0a0d11]">
          <div className="px-4 py-6 text-center text-[clamp(2.4rem,3vw,5.5rem)] font-black tracking-tight leading-none text-zinc-100">
            <span className="text-[#ff6a1a]">Sneakerness</span>
            <span className="text-white">®</span>
            <span className="text-white"> Rotterdam - Van Nellefabriek</span>
          </div>
          <div className="pb-6 text-center text-xl text-zinc-400 md:text-2xl">
            Tweedaags sneaker-event
          </div>
        </section>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
          <button className="w-full max-w-[360px] border border-white/70 bg-[#ff6a1a] px-8 py-4 text-2xl font-bold text-white transition hover:brightness-110 md:text-3xl">
            Tickets kopen
          </button>
          <button className="w-full max-w-[360px] border border-white/70 bg-[#2b2b2f] px-8 py-4 text-2xl font-bold text-white transition hover:bg-[#34343a] md:text-3xl">
            Stand huren
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-5 md:flex-row">
          <button className="w-full max-w-[220px] border border-white/70 bg-transparent px-6 py-4 text-2xl font-medium text-zinc-100 transition hover:bg-white/5">
            Zaterdag
          </button>
          <button className="w-full max-w-[220px] border border-white/70 bg-transparent px-6 py-4 text-2xl font-medium text-zinc-100 transition hover:bg-white/5">
            Zondag
          </button>
        </div>

        <TicketTable />

        <div className="mx-auto mt-8 max-w-[1200px] text-left text-[2rem] font-medium italic text-zinc-200">
          Selecteer een tijdslot om tickets te kopen
        </div>

        <Footer
          info="Sneakerness Rotterdam • Van Nellefabriek • 11-12 oktober"
          copyright="© 2026 Sneakerness. Alle rechten voorbehouden."
        />
      </div>
    </main>
  );
}
