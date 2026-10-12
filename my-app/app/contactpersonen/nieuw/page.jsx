import Header from '../../components/header';
import Hero from '../../components/hero';
import Footer from '../../components/footer';
import NieuwContactForm from '../../components/contactpersonen/NieuwContactForm';
import { getHomepageContent } from '../../lib/homepage-content';

export default function NieuwContactpersoonPage() {
    const content = getHomepageContent();

    return (
        <>
            <Header />
            <Hero eventName={content.eventName} venue={content.venue} tagline={content.tagline} />
            <NieuwContactForm />
            <Footer info={content.footerInfo} copyright={content.copyright} />
        </>
    );
}
