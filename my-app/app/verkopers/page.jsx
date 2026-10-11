import Footer from "../components/footer";
import Link from "next/link";
import Header from "../components/header";
import VerkopersOverzicht from "./verkopers-overzicht";

export const metadata = {
  title: "Verkopers Overzicht | Sneakerness Rotterdam",
  description: "Bekijk en filter de verkopers van Sneakerness Rotterdam.",
};

export default function VerkopersPagina() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <h1 className="mb-8 text-center text-3xl font-extrabold uppercase tracking-widest text-neutral-300 sm:text-4xl">
          Verkopers Overzicht
        </h1>
        <VerkopersOverzicht />
        <div className="mt-6 flex justify-end">
          <Link href="/verkopers/toevoegen" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-500">
            Verkoper Toevoegen
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
