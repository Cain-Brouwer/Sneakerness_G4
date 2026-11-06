import Header from "../../../components/layout/header.jsx";
import Footer from "../../../components/layout/footer.jsx";
import VerkoperVerwijderenBevestiging from "./verkoper-verwijderen-bevestiging.jsx";

export const metadata = { title: "Verkoper Verwijderen | Sneakerness Rotterdam" };

export default async function toonVerkoperVerwijderenBevestiging({ params }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 py-4 sm:py-8">
        <h1 className="mb-8 break-words text-center text-2xl font-extrabold uppercase tracking-wider text-neutral-300 sm:text-3xl lg:text-4xl">Verkoper Verwijderen</h1>
        <VerkoperVerwijderenBevestiging verkoperId={id} />
      </main>
      <Footer />
    </>
  );
}
