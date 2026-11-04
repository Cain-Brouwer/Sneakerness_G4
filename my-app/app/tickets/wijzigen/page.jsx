import Link from "next/link";
import { connection } from "next/server";
import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import TicketWijzigenFormulier from "./ticket-wijzigen-formulier.jsx";
import { checkDatabaseConnection } from "../../../lib/database/db.js";
import { findDetailById, getTypes } from "../../models/ticket.js";
import { getHomepageContent } from "../../../lib/homepage-content";

export const metadata = {
  title: "Ticket wijzigen | Sneakerness Rotterdam",
  description: "Pas de gegevens van een bestaand ticket van Sneakerness Rotterdam aan.",
};

export default async function TicketWijzigenPage({ searchParams }) {
  // Altijd live uit de database lezen (niet tijdens de build)
  await connection();

  // Gooit een Error als er geen databaseverbinding is (zie app/error.jsx)
  await checkDatabaseConnection();

  // Het id van het ticket staat in de URL: /tickets/wijzigen?id=1
  const params = await searchParams;
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // Het ticket (via een JOIN met tickettypes) en de tickettypes (voor de dropdown) komen uit de database
  const ticket = id && /^\d+$/.test(id) ? await findDetailById(Number(id)) : null;
  const ticketTypes = await getTypes();

  // Footerteksten komen uit dezelfde bron als de homepage
  const content = getHomepageContent();

  return (
    <>
      {/* Header (op mobiel met "Terug") */}
      <Header terugHref="/tickets" />

      {/* Pagina Titel */}
      <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neutral-400 sm:text-3xl md:text-center">
        Ticket wijzigen
      </h1>

      {ticket ? (
        // Het formulier start met de huidige gegevens van het ticket
        <TicketWijzigenFormulier ticket={ticket} ticketTypes={ticketTypes} />
      ) : (
        // Geen ticket met dit id: niets te wijzigen
        <section className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6">
          <p
            role="alert"
            className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400"
          >
            Het ticket is niet gevonden.
          </p>
          <Link
            href="/tickets"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-bold text-neutral-100 transition-all hover:border-neutral-500 hover:bg-neutral-700 active:scale-[0.99]"
          >
            Terug naar overzicht
          </Link>
        </section>
      )}

      {/* Footer */}
      <Footer info={content.footerInfo} copyright={content.copyright} />
    </>
  );
}