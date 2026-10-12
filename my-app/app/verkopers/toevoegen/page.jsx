import Header from "../../components/header";
import Footer from "../../components/footer";
import VerkoperToevoegenFormulier from "./verkoper-toevoegen-formulier";

export const metadata = { title: "Verkoper Toevoegen | Sneakerness Rotterdam" };

export default function toonVerkoperToevoegenFormulier() {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1">
        <h1 className="mb-8 text-center text-2xl font-extrabold uppercase tracking-widest text-neutral-300 sm:text-3xl md:text-4xl">
          Verkoper Toevoegen
        </h1>
        <VerkoperToevoegenFormulier />
      </main>
      <Footer />
    </>
  );
}
