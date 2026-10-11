import Footer from "../components/footer";
import Link from "next/link";
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
        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/stands/reserveren" className="rounded-xl border border-orange-700 px-5 py-3 font-bold text-orange-400 hover:bg-orange-950/40">
            Stand Reserveren
          </Link>
          <Link href="/stands/toevoegen" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-500">
            Stand Toevoegen
          </Link>
        </div>
      </main>

      <Footer
        info="Locatie: Van Nellefabriek, Rotterdam. Tweedaags sneaker-event."
        copyright={`© ${new Date().getFullYear()} Sneakerness Rotterdam. Alle rechten voorbehouden.`}
      />
    </>
  );
}
