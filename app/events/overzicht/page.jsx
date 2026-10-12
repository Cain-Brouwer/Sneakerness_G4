'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Footer from '../../components/footer';
import Header from '../../components/header';
import { formatEventDateRange, getStoredEvents } from '../eventStorage';

const upcomingEvents = [
  { date: '14–15 november 2026', title: 'Sneakerness Rotterdam 2026', location: 'Van Nellefabriek, Rotterdam', description: 'De grootste sneakerbeurs van Nederland met sneakers, streetwear en limited drops.', time: '10:00–18:00 uur', action: 'Tickets kopen', primary: true },
  { date: '5–6 december 2026', title: 'Sneakerness Amsterdam 2026', location: 'RAI Amsterdam', description: 'Twee dagen vol sneakers, exposanten en speciale events.', time: '10:00–18:00 uur', action: 'Tickets kopen', primary: true },
  { date: '16–17 januari 2027', title: 'Sneakerness Utrecht 2027', location: 'Jaarbeurs Utrecht', description: 'Start het jaar met de eerste sneakerbeurs van 2027.', time: '10:00–18:00 uur', action: 'Bekijk details', primary: false },
];

const archivedEvents = [
  ['Sneakerness Rotterdam 2025', 'Van Nellefabriek · 15–16 november 2025'],
  ['Sneakerness Amsterdam 2025', 'RAI Amsterdam · 6–7 december 2025'],
  ['Sneakerness Utrecht 2026', 'Jaarbeurs Utrecht · 17–18 januari 2026'],
];

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-details">
        <h3>{event.title}</h3>
        <p className="event-meta">{event.location} · {event.date}</p>
        <p>{event.description}</p>
      </div>
      <p className="event-time">{event.time}</p>
      <Link className={`button ${event.primary ? 'button-primary' : 'button-secondary'} event-action`} href={event.primary ? '/#tickets' : '#details'}>{event.action}</Link>
    </article>
  );
}

export default function EventsOverviewPage() {
  const [createdEvents, setCreatedEvents] = useState([]);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      setCreatedEvents(getStoredEvents());
    } catch (error) {
      console.error('Opgeslagen events konden niet worden geladen.', error);
      setStorageError('Opgeslagen events konden niet worden geladen vanuit de browseropslag.');
    }
  }, []);

  return (
    <div className="site-shell">
      <Header active="events" />
      <main className="events-page">
        <section className="page-heading" aria-labelledby="events-title">
          <Link className="back-link" href="/">← Terug</Link>
          <h1 id="events-title">Evenementen overzicht</h1>
          <Link className="button button-primary add-event-link" href="/events/toevoegen">Event toevoegen</Link>
        </section>
        <section className="event-section" aria-labelledby="upcoming-title">
          <div className="section-heading"><h2 id="upcoming-title">Aankomende events</h2></div>
          {storageError && <p className="form-message form-message-error" role="alert">{storageError}</p>}
          <div className="event-list">
            {upcomingEvents.map((event) => <EventCard key={event.title} event={event} />)}
            {createdEvents.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  date: formatEventDateRange(event.startDate, event.endDate),
                  time: `${event.startTime}–${event.endTime} uur`,
                  action: 'Bekijk details',
                  primary: false,
                }}
              />
            ))}
          </div>
        </section>
        <section className="archive-section" aria-labelledby="archive-title">
          <div className="section-heading"><h2 id="archive-title">Vorige edities</h2></div>
          <div className="archive-grid">{archivedEvents.map(([title, details]) => <article className="archive-card" key={title}><div><h3>{title}</h3><p>{details}</p></div><p className="archive-status">Archief</p><Link className="button button-secondary" href="#details">Bekijk details</Link></article>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
