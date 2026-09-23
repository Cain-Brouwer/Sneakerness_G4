import Link from 'next/link';

export default function Header({ active = 'home' }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/">SNEAKERNESS</Link>
      <nav className="main-nav" aria-label="Hoofdnavigatie">
        <Link className={active === 'home' ? 'active' : ''} href="/">Home</Link>
        <Link href="/#tickets">Tickets</Link>
        <Link href="/#stands">Stands</Link>
        <Link className={active === 'events' ? 'active' : ''} href="/events/overzicht" aria-current={active === 'events' ? 'page' : undefined}>Events</Link>
        <Link href="/#info">Info</Link>
      </nav>
    </header>
  );
}
