import Hero from '../components/hero';
import Header from '../components/header'
import Footer from '../components/footer'
import db from '../../lib/database/db';

export default function Page () {
    return (
        <>
            <Hero />
            <Header />
            <Footer />
        </>
        );

}