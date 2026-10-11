import Header from "../../components/header";
import Footer from "../../components/footer";
import StandToevoegenFormulier from "./stand-toevoegen-formulier";

export const metadata = { title: "Stand Toevoegen | Sneakerness Rotterdam" };

export default function toonStandToevoegenFormulier() {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1">
        <h1 className="mb-8 break-words text-center text-2xl font-extrabold uppercase tracking-wider text-neutral-300 sm:text-3xl sm:tracking-widest lg:text-4xl">
          Stand Toevoegen
        </h1>
        <StandToevoegenFormulier />
      </main>
      <Footer />
    </>
  );
}
