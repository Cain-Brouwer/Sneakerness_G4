import Header from '../../components/layout/header.jsx';
import Hero from '../../components/layout/hero.jsx';
import Footer from '../../components/layout/footer.jsx';
import NieuwContactForm from '../../components/contactpersonen/NieuwContactForm';
import { getHomepageContent } from '../../../lib/homepage-content';

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
