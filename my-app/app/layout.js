import './globals.css';

export const metadata = {
  title: 'Ticket overzicht | Sneakerness',
  description: 'Ticket overzicht voor Sneakerness Rotterdam',
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
