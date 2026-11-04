'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Footer from '../../components/footer';
import Header from '../../components/header';
import { formatEventDateRange, getAllEvents } from '../eventStorage';

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
      <Link className="button button-secondary event-edit-link" href={`/events/wijzigen?id=${encodeURIComponent(event.id)}`}>Event wijzigen</Link>
    </article>
  );
}

export default function EventsOverviewPage() {
  const [events, setEvents] = useState([]);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      setEvents(getAllEvents());
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
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  date: formatEventDateRange(event.startDate, event.endDate),
                  time: `${event.startTime}–${event.endTime} uur`,
                  action: event.action || 'Bekijk details',
                  primary: Boolean(event.primary),
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
