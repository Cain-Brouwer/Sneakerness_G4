import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import StandReserverenFormulier from "./stand-reserveren-formulier";

export const metadata = { title: "Stand Reserveren | Sneakerness Rotterdam" };

export default function toonStandReserverenFormulier() {
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1">
        <h1 className="mb-8 break-words text-center text-2xl font-extrabold uppercase tracking-wider text-neutral-300 sm:text-3xl sm:tracking-widest lg:text-4xl">Stand Reserveren</h1>
        <StandReserverenFormulier />
      </main>
      <Footer />
    </>
  );
}
