import Footer from "../components/footer";
import Header from "../components/header";
import StandsOverzicht from "./stands-overzicht";

export const metadata = {
  title: "Stands Overzicht | Sneakerness Rotterdam",
  description: "Bekijk en filter de stands van Sneakerness Rotterdam.",
};

export default function StandsPagina() {
  return (
    <>
      <Header />

      <main className="flex flex-1 flex-col gap-6">
        <h1 className="break-words text-center text-2xl font-extrabold uppercase tracking-wider text-neutral-300 sm:text-3xl sm:tracking-widest lg:text-4xl">
          Stands Overzicht
        </h1>

        <StandsOverzicht />
      </main>

      <Footer
        info="Locatie: Van Nellefabriek, Rotterdam. Tweedaags sneaker-event."
        copyright={`© ${new Date().getFullYear()} Sneakerness Rotterdam. Alle rechten voorbehouden.`}
      />
    </>
  );
}
