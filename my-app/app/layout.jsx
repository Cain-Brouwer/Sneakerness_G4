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
      <body className="min-h-full flex flex-col">
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500 selection:text-white">
          <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
