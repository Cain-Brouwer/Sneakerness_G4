import Link from 'next/link';
import Footer from './components/footer';
import Header from './components/header';
import Hero from './components/hero';

export default function HomePage() {
  return (
    <div className="site-shell">
      <Header />
      <main>
        <Hero />
        <div className="action-row">
          <Link className="button button-primary" href="#tickets">Tickets kopen</Link>
          <Link className="button button-secondary" href="#stands">Stand huren</Link>
        </div>
        <section className="home-grid" aria-label="Eventinformatie">
          <article className="panel">
            <p className="section-label">OVER HET EVENT</p>
            <p>Sneakerness Rotterdam is een tweedaags sneaker-event in de Van Nellefabriek. Bezoekers vinden releases, vintage pairs, customizers en community-stands onder één dak.</p>
          </article>
          <article className="panel" id="tickets">
            <p className="section-label">TICKETS &amp; TOEGANG</p>
            <div className="ticket-line"><span>Dagkaart</span><strong>€25</strong><em>Ja</em></div>
            <div className="ticket-line"><span>Weekendpas</span><strong>€40</strong><em>Ja</em></div>
            <div className="ticket-line"><span>Early Entry</span><strong>€55</strong><em className="limited">Beperkt</em></div>
          </article>
        </section>
        <section className="stand-grid" id="stands" aria-label="Standtypes">
          <article className="mini-panel"><h2>AA+ Stand</h2><p>Premium locatie, grootste oppervlakte</p></article>
          <article className="mini-panel"><h2>AA Stand</h2><p>Grote stand op een zichtbare plek</p></article>
          <article className="mini-panel"><h2>A Stand</h2><p>Standaard stand voor verkopers</p></article>
          <article className="mini-panel"><h2>Side-Stand</h2><p>Compacte stand langs de zijlijn</p></article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
