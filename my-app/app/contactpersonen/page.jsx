import Header from '../components/header';
import Hero from '../components/hero';
import Footer from '../components/footer';
import ContactpersonenLijst from '../components/contactpersonen/ContactpersonenLijst';
import {getHomepageContent} from '../lib/homepage-content';
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
            "SELECT Naam, Telefoonnummer, Email AS Email FROM contactpersonen",
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
