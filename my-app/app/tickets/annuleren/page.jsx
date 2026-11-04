import Link from "next/link";
import { connection } from "next/server";
import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import TicketAnnulerenFormulier from "./ticket-annuleren-formulier.jsx";
import { checkDatabaseConnection } from "../../../lib/database/db.js";
import { findDetailById } from "../../models/ticket.js";
import { getHomepageContent } from "../../../lib/homepage-content";

export const metadata = {
  title: "Ticket annuleren | Sneakerness Rotterdam",
  description: "Bevestig het annuleren van een ticket voor Sneakerness Rotterdam.",
};

// Melding uit de user story (scenario "niet succesvol"). Ook bij een ticket dat niet bestaat.
const MELDING_FOUT = "Er is een fout opgetreden. Het ticket kon niet worden geannuleerd.";

const prijsFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const datumFormat = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// Kleur en tekst van de status van het ticket
const statusWeergave = {
  actief: { tekst: "Actief", klasse: "bg-emerald-950 text-emerald-400 border border-emerald-800" },
  geannuleerd: { tekst: "Geannuleerd", klasse: "bg-red-950 text-red-400 border border-red-900/60" },
  gebruikt: { tekst: "Gebruikt", klasse: "bg-neutral-800 text-neutral-300 border border-neutral-700" },
};

const labelClass = "text-xs font-semibold uppercase tracking-wider text-neutral-400";

export default async function TicketAnnulerenPage({ searchParams }) {
  // Altijd live uit de database lezen (niet tijdens de build)
  await connection();

  // Gooit een Error als er geen databaseverbinding is (zie app/error.jsx)
  await checkDatabaseConnection();

  // Het id van het ticket staat in de URL: /tickets/annuleren?id=1
  const params = await searchParams;
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // Haal het ticket op, inclusief de naam van het tickettype (JOIN met tickettypes)
  const ticket = id && /^\d+$/.test(id) ? await findDetailById(Number(id)) : null;
  const status = ticket ? statusWeergave[ticket.Status] ?? statusWeergave.actief : null;

  // Footerteksten komen uit dezelfde bron als de homepage
  const content = getHomepageContent();

  return (
    <>
      {/* Header (op mobiel met "Terug") */}
      <Header terugHref="/tickets" />

      {/* Pagina Titel */}
      <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neutral-400 sm:text-3xl md:text-center">
        Ticket annuleren
      </h1>

      <section className="mx-auto w-full max-w-2xl space-y-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
        {ticket ? (
          <>
            {/* Gegevens van het ticket dat geannuleerd gaat worden */}
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className={labelClass}>Ticket</dt>
                <dd className="mt-1 text-lg font-bold text-white">{ticket.Ticketnaam}</dd>
              </div>
              <div>
                <dt className={labelClass}>Tickettype</dt>
                <dd className="mt-1 text-lg text-neutral-100">{ticket.Tickettype}</dd>
              </div>
              <div>
                <dt className={labelClass}>Datum en tijd</dt>
                <dd className="mt-1 text-neutral-100">
                  {datumFormat.format(new Date(`${ticket.Evenementdatum}T00:00:00Z`))}
                  {" · "}
                  {ticket.Tijdslot ?? "Hele dag"}
                </dd>
              </div>
              <div>
                <dt className={labelClass}>Prijs</dt>
                <dd className="mt-1 font-bold text-orange-400">{prijsFormat.format(ticket.Prijs)}</dd>
              </div>
              <div>
                <dt className={labelClass}>Status</dt>
                <dd className="mt-1">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.klasse}`}>
                    {status.tekst}
                  </span>
                </dd>
              </div>
            </dl>

            {/* Bevestigingsknop. Is het ticket al gebruikt of geannuleerd, dan geeft de actie de foutmelding. */}
            <TicketAnnulerenFormulier ticketId={ticket.id} />
          </>
        ) : (
          // Geen ticket met dit id: er wordt niets geannuleerd en de foutmelding verschijnt
          <div className="space-y-4">
            <p
              role="alert"
              className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400"
            >
              {MELDING_FOUT}
            </p>
            <Link
              href="/tickets"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-neutral-100 transition-all hover:border-neutral-500 hover:bg-neutral-700 active:scale-[0.99]"
            >
              Terug naar overzicht
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer info={content.footerInfo} copyright={content.copyright} />
    </>
  );
}