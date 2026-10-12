import Header from '../components/header';
import Hero from '../components/hero';
import Footer from '../components/footer';
import Bevestiging from '../components/aankoop/Bevestiging';
import {getHomepageContent} from '../lib/homepage-content';

export const metadata = {
    title: "Tickets Kopen | Sneakerness Rotterdam",
    description: "Koop tickets voor Sneakerness Rotterdam.",
};

export default function Page() {
    const content = getHomepageContent();

    return (
        <>
            <Header/>
            <Hero eventName={content.eventName} venue={content.venue} tagline={content.tagline}/>
            <Bevestiging />
            <Footer info={content.footerInfo} copyright={content.copyright}/>
        </>
    );
}
