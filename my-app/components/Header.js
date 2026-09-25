"use client";

// Header component: displays the main navigation and mobile menu for the website.
// It keeps the brand visible and links users to the important sections of the homepage.
import { useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "#tickets", label: "Tickets" },
  { href: "#stands", label: "Stands" },
  { href: "#info", label: "Info" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
      <div className="grid grid-cols-[auto_1fr_auto] items-stretch">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center border-r border-neutral-800 px-5 py-3 text-base font-black tracking-wider text-orange-500 hover:bg-neutral-800/50 transition-colors"
        >
          SNEAKERNESS
        </Link>

        <div aria-hidden="true" />

        {/* Desktop Navigatie */}
        <nav
          className="hidden items-center justify-center gap-1 border-l border-neutral-800 px-3 py-2 text-sm md:flex"
          aria-label="Hoofdnavigatie"
        >
          {navItems.map((item) => {
            const isAnchor = item.href.startsWith("#");
            const Component = isAnchor ? "a" : Link;
            return (
              <Component
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-neutral-300 font-medium rounded-lg hover:text-white hover:bg-neutral-800 transition-all"
              >
                {item.label}
              </Component>
            );
          })}
        </nav>

        {/* Mobiel menu knop */}
        <button
          type="button"
          className="flex items-center justify-center border-l border-neutral-800 px-4 py-3 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobiel-menu"
          aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {menuOpen ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {/* Mobiel Menu Dropdown */}
      {menuOpen && (
        <nav
          id="mobiel-menu"
          className="flex flex-col border-t border-neutral-800 bg-neutral-900 md:hidden"
          aria-label="Mobiele navigatie"
        >
          {navItems.map((item) => {
            const isAnchor = item.href.startsWith("#");
            const Component = isAnchor ? "a" : Link;
            return (
              <Component
                key={item.href}
                href={item.href}
                className="border-b border-neutral-800/60 px-5 py-3.5 text-sm font-medium text-neutral-300 last:border-b-0 hover:bg-neutral-800 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Component>
            );
          })}
        </nav>
      )}
    </header>
  );
}