import Footer from "../components/footer";
import Header from "../components/header";
import VerkopersOverzicht from "./verkopers-overzicht";

export const metadata = {
  title: "Verkopers Overzicht | Sneakerness Rotterdam",
  description: "Bekijk en filter de verkopers van Sneakerness Rotterdam.",
};

export default function VerkopersPagina() {
  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-orange-500 selection:text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
        <Header />

        <main className="flex-1">
          <h1 className="mb-8 text-center text-3xl font-extrabold uppercase tracking-widest text-neutral-300 sm:text-4xl">
            Verkopers Overzicht
          </h1>
          <VerkopersOverzicht />
        </main>

        <Footer />
      </div>
    </div>
  );
}
