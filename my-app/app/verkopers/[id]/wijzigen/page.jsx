import Header from "../../../components/layout/header.jsx";
import Footer from "../../../components/layout/footer.jsx";
import VerkoperWijzigenFormulier from "./verkoper-wijzigen-formulier.jsx";

export const metadata = { title: "Verkoper Wijzigen | Sneakerness Rotterdam" };

export default async function toonVerkoperWijzigenFormulier({ params }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 py-4 sm:py-8">
        <h1 className="mb-8 break-words text-center text-2xl font-extrabold uppercase tracking-wider text-neutral-300 sm:text-3xl lg:text-4xl">Verkoper Wijzigen</h1>
        <VerkoperWijzigenFormulier verkoperId={id} />
      </main>
      <Footer />
    </>
  );
}
