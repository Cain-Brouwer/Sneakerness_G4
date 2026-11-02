import Header from '../components/layout/header.jsx';
import Hero from '../components/layout/hero.jsx';
import Footer from '../components/layout/footer.jsx';
import ContactpersonenLijst from '../components/contactpersonen/ContactpersonenLijst';
import {getHomepageContent} from '../../lib/homepage-content';
import { findAll } from '../models/contactpersoon.js';

export const metadata = {
    title: "Contactpersonen | Sneakerness Rotterdam",
    description: "Bekijk de contactpersonen van Sneakerness Rotterdam.",
};


export default async function Page() {
    const content = getHomepageContent();
    const contactpersonen = await findAll();

    return (
        <>
            <Header/>
            <Hero eventName={content.eventName} venue={content.venue} tagline={content.tagline}/>
            <ContactpersonenLijst contactpersonen={contactpersonen} />
            <Footer info={content.footerInfo} copyright={content.copyright}/>
        </>
    )
}
