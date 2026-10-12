import { connection } from "next/server";
import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import TicketKopenFormulier from "./ticket-kopen-formulier";
import { getTicketsVoorVerkoop } from "../../../lib/database/tickets";
import { getHomepageContent } from "../../../lib/homepage-content";

export const metadata = {
  title: "Tickets kopen | Sneakerness Rotterdam",
  description: "Koop tickets voor Sneakerness Rotterdam in een paar stappen.",
};

const MELDING_LADEN_MISLUKT = "Er is een fout opgetreden. De tickets konden niet worden geladen.";

export default async function TicketsKopenPage({ searchParams }) {
  // Altijd live uit de database lezen (niet tijdens de build)
  await connection();

  // Testhulp voor het foutscenario bij het kopen: /tickets/kopen?debug=1
  const params = await searchParams;
  const debug = params?.debug === "1";

  // De tickets die nog te koop zijn komen uit de database
  let tickets = [];
  let ladenMislukt = false;
  try {
    tickets = await getTicketsVoorVerkoop();
  } catch (error) {
    console.error("Tickets laden mislukt:", error);
    ladenMislukt = true;
  }

  // Footerteksten komen uit dezelfde bron als de homepage
  const content = getHomepageContent();

  // De container om de pagina (breedte, padding, achtergrond) komt uit app/layout.jsx
  return (
    <>
      {/* Header met "Terug naar home" zoals in de wireframe */}
      <Header terugHref="/" terugOpDesktop />

      {/* Pagina Titel */}
      <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neutral-400 sm:text-3xl md:text-center">
        Tickets kopen
      </h1>

      {ladenMislukt ? (
        <p
          role="alert"
          className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-400"
        >
          {MELDING_LADEN_MISLUKT}
        </p>
      ) : (
        <TicketKopenFormulier tickets={tickets} debug={debug} />
      )}

      {/* Footer */}
      <Footer info={content.footerInfo} copyright={content.copyright} />
    </>
  );
}