import Header from '../components/layout/header.jsx';
import Hero from '../components/layout/hero.jsx';
import Footer from '../components/layout/footer.jsx';
import ContactpersonenLijst from '../components/contactpersonen/ContactpersonenLijst';
import {getHomepageContent} from '../../lib/homepage-content';
import {
    haalRijenOp,
    initialiseerDatabase,
    sluitDatabase,
} from '../../lib/database/db';

export const metadata = {
    title: "Contactpersonen | Sneakerness Rotterdam",
    description: "Bekijk de contactpersonen van Sneakerness Rotterdam.",
};


export default async function Page() {
    const content = getHomepageContent();
    const database = await initialiseerDatabase();
    let contactpersonen;

    try {
        contactpersonen = await haalRijenOp(
            database,
            "SELECT id, Naam, Telefoonnummer, Email AS Email FROM contactpersonen",
        );
    } finally {
        await sluitDatabase(database);
    }

    return (
        <>
            <Header/>
            <Hero eventName={content.eventName} venue={content.venue} tagline={content.tagline}/>
            <ContactpersonenLijst contactpersonen={contactpersonen} />
            <Footer info={content.footerInfo} copyright={content.copyright}/>
        </>
    )
}
