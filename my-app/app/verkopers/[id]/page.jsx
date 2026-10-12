import Header from "../../components/header";
import Footer from "../../components/footer";
import VerkoperDetail from "./verkoper-detail";

export function generateStaticParams() {
    return [];
}

export default async function Page({ params }) {
    const { id } = await params;
    return (
        <>
            <Header />

            <main className="flex-1 px-4 py-8 md:px-6">
                <div className="mx-auto max-w-4xl">
                    <h1 className="mb-8 text-center text-3xl font-extrabold uppercase tracking-widest text-neutral-300 sm:text-4xl">
                        Verkoper Details
                    </h1>
                    <VerkoperDetail verkoperId={id} />
                </div>
            </main>

            <Footer />
        </>
    );
}
