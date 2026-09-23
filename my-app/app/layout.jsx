// Root layout: defines the global HTML structure and shared metadata for the app.
// It also loads the custom fonts and applies the base body styling for every page.
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Homepagina | Sneakerness Rotterdam",
  description:
    "Homepagina van Sneakerness Rotterdam: informatie over het tweedaagse sneaker-event in de Van Nellefabriek, tickets en stands.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">{children}</body>
    </html>
  );
}
