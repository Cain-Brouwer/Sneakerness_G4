import Link from "next/link";
import { connection } from "next/server";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { checkDatabaseConnection } from "../lib/database/db";
import { getTicketOverview } from "../lib/database/tickets";
import { getHomepageContent } from "../lib/homepage-content";

export const metadata = {
  title: "Ticket overzicht | Sneakerness Rotterdam",
  description:
    "Bekijk alle tickets van Sneakerness Rotterdam met tijdsloten, prijzen en beschikbaarheid.",
};

// Melding uit de user story (scenario "Fout bij laden van overzicht").
const MELDING_FOUT = "Er is een fout opgetreden. Het overzicht kon niet worden geladen.";

// Bij zoveel of minder tickets tonen we "beperkt beschikbaar" (oranje).
const LAGE_VOORRAAD = 10;

const prijsFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const weekdagFormat = new Intl.DateTimeFormat("nl-NL", { weekday: "long", timeZone: "UTC" });
const korteDatumFormat = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function naarDatum(datum) {
  return new Date(`${datum}T00:00:00Z`);
}

function weekdagNaam(datum) {
  const date = naarDatum(datum);
  if (Number.isNaN(date.getTime())) return String(datum);
  const naam = weekdagFormat.format(date);
  return naam.charAt(0).toUpperCase() + naam.slice(1);
}

// Maakt de dag-knoppen op basis van de datums die echt in de database staan.
// Heeft een weekdag meerdere datums, dan zetten we de datum erbij ("Zaterdag 10 okt").
function maakDagen(tickets) {
  const datums = [...new Set(tickets.map((ticket) => ticket.Evenementdatum))];
  const namen = datums.map(weekdagNaam);

  return datums.map((datum, index) => {
    const komtMeerdereKeren = namen.filter((naam) => naam === namen[index]).length > 1;
    const label = komtMeerdereKeren
      ? `${namen[index]} ${korteDatumFormat.format(naarDatum(datum))}`
      : namen[index];
    return { datum, label };
  });
}

function beschikbaarheid(aantal) {
  if (aantal <= 0) {
    return {
      tekst: "Uitverkocht",
      klasse: "bg-red-950 text-red-400 border border-red-900/60",
    };
  }
  return {
    tekst: `${aantal} beschikbaar`,
    klasse:
      aantal <= LAGE_VOORRAAD
        ? "bg-amber-950 text-amber-400 border border-amber-800"
        : "bg-emerald-950 text-emerald-400 border border-emerald-800",
  };
}

// Haalt alle tickets uit de database. Gaat er iets mis, dan krijgt de pagina { fout: true }
// en worden er geen tickets getoond (zie MELDING_FOUT).
async function laadOverzicht(gevraagdeDag, forceerFout) {
  try {
    // Testhulp voor het foutscenario: /tickets?debug=1 (zelfde idee als /trigger-error).
    if (forceerFout) throw new Error("Handmatig getriggerde fout voor testdoeleinden");

    await checkDatabaseConnection();
    const alleTickets = await getTicketOverview();

    const dagen = maakDagen(alleTickets);
    const gekozenDag = dagen.find((dag) => dag.datum === gevraagdeDag) ?? dagen[0] ?? null;
    const tickets = gekozenDag
      ? alleTickets.filter((ticket) => ticket.Evenementdatum === gekozenDag.datum)
      : [];

    return { fout: false, dagen, gekozenDag, tickets };
  } catch (error) {
    console.error("Ticketoverzicht laden mislukt:", error);
    return { fout: true, dagen: [], gekozenDag: null, tickets: [] };
  }
}

// Titel van een kaart: op mobiel "op de rand" van het kader (zoals de wireframe),
// op desktop gewoon bovenin de kaart.
const kaartTitelClass =
  "absolute -top-3 left-4 bg-neutral-950 px-2 text-base font-bold text-orange-500 md:static md:mb-4 md:bg-transparent md:p-0 md:text-xl";

export default async function TicketOverzichtPage({ searchParams }) {
  // Altijd live uit de database lezen (niet tijdens de build)
  await connection();

  const params = await searchParams;
  const gevraagdeDag = Array.isArray(params?.dag) ? params.dag[0] : params?.dag;
  const { fout, dagen, gekozenDag, tickets } = await laadOverzicht(
    gevraagdeDag,
    params?.debug === "1"
  );

  // Footerteksten komen uit dezelfde bron als de homepage
  const content = getHomepageContent();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500 selection:text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header (op mobiel met "Terug" zoals in de wireframe) */}
        <Header terugHref="/" />

        {/* Pagina Titel */}
        <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neutral-400 sm:text-3xl md:text-center">
          Ticket overzicht
        </h1>

        {/* Kies dag */}
        {!fout && dagen.length > 0 && (
          <section
            aria-labelledby="kies-dag-titel"
            className="relative mt-8 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 pb-4 pt-6 md:mt-6 md:border-0 md:bg-transparent md:p-0"
          >
            <h2 id="kies-dag-titel" className={`${kaartTitelClass} md:text-center`}>
              Kies dag
            </h2>
            <div className="flex flex-wrap gap-3 md:justify-center">
              {dagen.map((dag) => {
                const isGekozen = dag.datum === gekozenDag.datum;
                return (
                  <Link
                    key={dag.datum}
                    href={`/tickets?dag=${dag.datum}`}
                    scroll={false}
                    aria-current={isGekozen ? "true" : undefined}
                    className={`flex flex-1 basis-[calc(50%-0.375rem)] items-center justify-center rounded-xl px-6 py-3 text-center text-lg font-bold transition-all active:scale-[0.99] md:w-48 md:flex-none md:basis-auto ${
                      isGekozen
                        ? "bg-orange-600 text-white shadow-lg hover:bg-orange-500 hover:shadow-orange-500/20"
                        : "border border-neutral-700 bg-neutral-800 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-700"
                    }`}
                  >
                    {dag.label}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Beschikbare tijdsloten */}
        <section
          id="tickets"
          aria-labelledby="tijdsloten-titel"
          className="relative mt-8 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 pt-6 transition-all hover:border-neutral-700 sm:p-6 sm:pt-6 md:mt-6"
        >
          <h2 id="tijdsloten-titel" className={kaartTitelClass}>
            Beschikbare tijdsloten
          </h2>

          {/* Scenario: fout bij laden van overzicht */}
          {fout && (
            <div role="alert" className="space-y-4">
              <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400">
                {MELDING_FOUT}
              </p>
              <Link
                href="/tickets"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-neutral-100 transition-all hover:border-neutral-500 hover:bg-neutral-700 active:scale-[0.99]"
              >
                Opnieuw proberen
              </Link>
            </div>
          )}

          {/* Geen tickets aangemaakt */}
          {!fout && tickets.length === 0 && (
            <p className="text-sm text-neutral-400">
              Er zijn op dit moment nog geen tickets beschikbaar.
            </p>
          )}

          {/* Scenario: overzicht wordt correct geladen */}
          {!fout && tickets.length > 0 && (
            <table className="block w-full text-left text-sm md:table md:table-fixed">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-neutral-800 text-xs uppercase text-neutral-400">
                  <th className="pb-3 text-center font-semibold">Tijd</th>
                  <th className="pb-3 text-center font-semibold">Prijs</th>
                  <th className="pb-3 text-center font-semibold">Beschikbaarheid</th>
                </tr>
              </thead>
              <tbody className="block space-y-3 md:table-row-group md:space-y-0 md:divide-y md:divide-neutral-800/60">
                {tickets.map((ticket) => {
                  const status = beschikbaarheid(ticket.AantalBeschikbaar);
                  const isUitverkocht = ticket.AantalBeschikbaar <= 0;
                  return (
                    <tr
                      key={ticket.id}
                      className={`grid grid-cols-[6rem_1fr_auto] items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-4 transition-colors md:table-row md:rounded-none md:border-0 md:bg-transparent md:hover:bg-neutral-800/40 ${
                        isUitverkocht ? "opacity-60" : ""
                      }`}
                    >
                      <td className="md:px-2 md:py-4 md:text-center">
                        <span className="block text-lg font-bold text-white md:text-xl">
                          {ticket.Tijdslot ?? "Hele dag"}
                        </span>
                        <span className="block text-xs uppercase tracking-wide text-neutral-500">
                          {ticket.Tickettype}
                        </span>
                      </td>
                      <td className="font-bold text-orange-400 md:px-2 md:py-4 md:text-center md:text-lg">
                        {prijsFormat.format(ticket.Prijs)}
                      </td>
                      <td className="text-right md:px-2 md:py-4 md:text-center">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold md:text-sm ${status.klasse}`}
                        >
                          {status.tekst}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Hint onder de tabel */}
        {!fout && tickets.length > 0 && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 text-center text-sm text-neutral-300 md:border-0 md:bg-transparent md:p-0 md:text-left md:text-base md:italic">
            <span className="md:hidden">Tik op een tijdslot om tickets te kopen</span>
            <span className="hidden md:inline">Selecteer een tijdslot om tickets te kopen</span>
          </p>
        )}

        {/* Footer */}
        <Footer info={content.footerInfo} copyright={content.copyright} sideBySide />
      </div>
    </div>
  );
}