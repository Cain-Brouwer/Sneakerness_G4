import Link from 'next/link';
import Footer from '../../components/footer';
import Header from '../../components/header';

const upcomingEvents = [
  { date: '14–15', month: 'NOV', year: '2026', title: 'Sneakerness Rotterdam 2026', location: 'Van Nellefabriek, Rotterdam', description: 'Tweedaags streetwear- en sneaker-event met exposities, talks en meer.', time: '10:00–18:00', action: 'Tickets kopen', primary: true },
  { date: '5–6', month: 'DEC', year: '2026', title: 'Sneakerness Amsterdam 2026', location: 'RAI Amsterdam', description: 'Twee dagen vol sneakers, exposanten en speciale events.', time: '10:00–18:00', action: 'Tickets kopen', primary: true },
  { date: '16–17', month: 'JAN', year: '2027', title: 'Sneakerness Utrecht 2027', location: 'Jaarbeurs Utrecht', description: 'Start het jaar met de eerste sneakerbeurs van 2027.', time: '10:00–18:00', action: 'Bekijk details', primary: false },
];

const archivedEvents = [
  ['Sneakerness Rotterdam 2025', 'Van Nellefabriek · 15–16 november 2025'],
  ['Sneakerness Amsterdam 2025', 'RAI Amsterdam · 6–7 december 2025'],
  ['Sneakerness Utrecht 2026', 'Jaarbeurs Utrecht · 17–18 januari 2026'],
];

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-date"><strong>{event.date}</strong><span>{event.month}<br />{event.year}</span></div>
      <div className="event-details"><h3>{event.title}</h3><p className="event-meta">{event.location}</p><p>{event.description}</p></div>
      <div className="event-time"><span>ZA–ZO</span><strong>{event.time}</strong></div>
      <Link className={`button ${event.primary ? 'button-primary' : 'button-secondary'} event-action`} href={event.primary ? '/#tickets' : '#details'}>{event.action}</Link>
    </article>
  );
}

export default function EventsOverviewPage() {
  return (
    <div className="site-shell">
      <Header active="events" />
      <main className="events-page">
        <section className="page-heading" aria-labelledby="events-title">
          <Link className="back-link" href="/">← Terug naar home</Link>
          <p className="eyebrow">AGENDA 2026–2027</p>
          <h1 id="events-title">Evenementen overzicht</h1>
          <p>Bekijk alle geplande Sneakerness-events en plan je volgende bezoek.</p>
        </section>
        <section className="event-section" aria-labelledby="upcoming-title">
          <div className="section-heading"><p className="section-label">KALENDER</p><h2 id="upcoming-title">Aankomende events</h2></div>
          <div className="event-list">{upcomingEvents.map((event) => <EventCard key={event.title} event={event} />)}</div>
        </section>
        <section className="archive-section" aria-labelledby="archive-title">
          <div className="section-heading"><p className="section-label">ARCHIEF</p><h2 id="archive-title">Vorige edities</h2></div>
          <div className="archive-grid">{archivedEvents.map(([title, details]) => <article className="archive-card" key={title}><div><h3>{title}</h3><p>{details}</p></div><span>ARCHIEF</span><Link href="#details">Bekijk details</Link></article>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
