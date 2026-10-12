import Link from 'next/link';
import Footer from '../../components/footer';
import Header from '../../components/header';
import EventForm from './event-form';

export const metadata = {
  title: 'Event toevoegen | Sneakerness',
};

export default function AddEventPage() {
  return (
    <div className="site-shell">
      <Header active="events" />
      <main className="events-page">
        <section className="page-heading" aria-labelledby="add-event-title">
          <Link className="back-link" href="/events/overzicht">← Terug naar overzicht</Link>
          <h1 id="add-event-title">Event toevoegen</h1>
          <p>Vul de gegevens van het nieuwe event in.</p>
        </section>
        <section className="event-section add-event-section" aria-label="Nieuw event">
          <EventForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
