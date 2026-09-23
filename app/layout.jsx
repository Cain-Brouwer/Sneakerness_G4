import './globals.css';

export const metadata = {
  title: 'Sneakerness Rotterdam',
  description: 'Sneakerness events en tickets',
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
