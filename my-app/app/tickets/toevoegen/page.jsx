import { connection } from "next/server";
import Header from "../../components/header";
import Footer from "../../components/footer";
import TicketForm from "./ticket-form";
import { checkDatabaseConnection } from "../../../lib/database/db";
import { getTicketTypes } from "../../../lib/database/tickets";
import { getHomepageContent } from "../../lib/homepage-content";

export const metadata = {
  title: "Ticket toevoegen | Sneakerness Rotterdam",
  description: "Voeg een nieuw ticket toe voor Sneakerness Rotterdam.",
};

export default async function TicketToevoegenPage() {
  // Altijd live uit de database lezen (niet tijdens de build)
  await connection();

  // Gooit een Error als er geen databaseverbinding is (zie app/error.jsx)
  await checkDatabaseConnection();

  // De tickettypes voor de dropdown komen uit de database
  const ticketTypes = await getTicketTypes();

  // Footerteksten komen uit dezelfde bron als de homepage
  const content = getHomepageContent();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500 selection:text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header */}
        <Header />

        {/* Pagina Titel */}
        <h1 className="text-center text-3xl font-extrabold uppercase tracking-widest text-neutral-400">
          Ticket toevoegen
        </h1>

        {/* Formulier */}
        <TicketForm ticketTypes={ticketTypes} />

        {/* Footer */}
        <Footer
          info={content.footerInfo}
          copyright={content.copyright}
          sideBySide
        />
      </div>
    </div>
  );
}