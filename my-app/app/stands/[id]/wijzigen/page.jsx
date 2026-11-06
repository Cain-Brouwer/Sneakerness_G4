import Header from "../../../components/layout/header.jsx";
import Footer from "../../../components/layout/footer.jsx";
import StandWijzigenFormulier from "./stand-wijzigen-formulier.jsx";

export const metadata = { title: "Stand Wijzigen | Sneakerness Rotterdam" };

export default async function toonStandWijzigenFormulier({ params }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-w-0 flex-1 py-4 sm:py-8">
        <h1 className="mb-8 break-words text-center text-2xl font-extrabold uppercase tracking-wider text-neutral-300 sm:text-3xl lg:text-4xl">Stand Wijzigen</h1>
        <StandWijzigenFormulier standId={id} />
      </main>
      <Footer />
    </>
  );
}
