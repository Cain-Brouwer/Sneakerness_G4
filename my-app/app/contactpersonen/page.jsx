import Hero from '../components/hero';
import Header from '../components/header'
import Footer from '../components/footer'
import db, { checkDatabaseConnection } from '../../lib/database/db';


export default async function Page() {

    // gooit een Error wanneer er geen verbinding met de database is,
    // zodat app/contactpersonen/error.jsx getriggerd wordt
    await checkDatabaseConnection();

    let contactpersoon;
    const contactpersonen = await init();
    // haalt de values van de aangegeven kolommen uit de database
    {
        for (contactpersoon of contactpersonen) {
            console.log(contactpersoon);
        }
    }
    // zorgt ervoor dat de pagina wacht tot de resultaten zijn opgehaald
    function init() {
        return new Promise((resolve, reject) => {
            // loopt door de resultaten heen
            db.all("SELECT Naam, Telefoonnummer, Email FROM contactpersonen", (error, contactpersonen) => {
                if (error) {
                    reject(new Error('Geen verbinding met de database'));
                } else {
                    resolve(contactpersonen);
                }

            })
        })
    }

    return (

        <>
            <Header/>
            <Hero eventName="Sneakerness" venue=""/>
            <div id={'content'} className="mx-auto max-w-6xl px-4 py-6">
                <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-all">
                    <h2 className="text-lg sm:text-xl font-bold mb-4 text-orange-500">Contactpersonen</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="hidden md:table-header-group">
                                <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-xs">
                                    <th className="pb-3 font-semibold">Naam</th>
                                    <th className="pb-3 font-semibold">Telefoonnummer</th>
                                    <th className="pb-3 font-semibold">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60">
                                {contactpersonen.map((contactpersoon) => (
                                    <tr key={contactpersoon.Naam} className="block py-3 md:table-row hover:bg-neutral-800/40 transition-colors">
                                        <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3 font-medium text-white">
                                            <span className="md:hidden text-xs uppercase text-neutral-500">Naam</span>
                                            <span className="text-right">{contactpersoon.Naam}</span>
                                        </td>
                                        <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3 text-orange-400 font-bold">
                                            <span className="md:hidden text-xs uppercase text-neutral-500">Telefoon</span>
                                            <span className="text-right">{contactpersoon.Telefoonnummer}</span>
                                        </td>
                                        <td className="flex items-baseline justify-between gap-4 py-0.5 md:table-cell md:py-3 text-neutral-300 break-all">
                                            <span className="md:hidden text-xs uppercase text-neutral-500">Email</span>
                                            <span className="text-right">{contactpersoon.Email}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <Footer/>
        </>
    )

}