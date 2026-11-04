import Link from 'next/link';
import Footer from '../../components/footer';
import Header from '../../components/header';
import EventEditor from './event-editor';

export const metadata = {
  title: 'Event wijzigen | Sneakerness',
};

export default function EditEventPage() {
  return (
    <div className="site-shell">
      <Header active="events" />
      <main className="events-page">
        <section className="page-heading" aria-labelledby="edit-event-title">
          <Link className="back-link" href="/events/overzicht">← Terug naar overzicht</Link>
          <h1 id="edit-event-title">Event wijzigen</h1>
          <p>Pas de gegevens van een bestaand event aan.</p>
        </section>
        <section className="event-section add-event-section" aria-label="Event wijzigen">
          <EventEditor />
        </section>
      </main>
      <Footer />
    </div>
  );
}
