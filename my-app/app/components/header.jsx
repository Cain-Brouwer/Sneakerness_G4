"use client";

import Link from "next/link";
import { useState } from "react";

const navigatieItems = [
  { href: "/", label: "Home" },
  { href: "/verkopers", label: "Verkopers" },
  { href: "/#tickets", label: "Tickets" },
  { href: "/#info", label: "Info" },
];

export default function Header() {
  const [mobielMenuOpen, setMobielMenuOpen] = useState(false);

  function wisselMobielMenu() {
    setMobielMenuOpen((menuIsOpen) => !menuIsOpen);
  }

  function sluitMobielMenu() {
    setMobielMenuOpen(false);
  }

  return (
    <header className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-lg backdrop-blur-md">
      <div className="grid grid-cols-[auto_1fr_auto] items-stretch">
        <Link
          href="/"
          className="flex items-center justify-center border-r border-neutral-800 px-5 py-3 text-base font-black tracking-wider text-orange-500 transition-colors hover:bg-neutral-800/50"
        >
          SNEAKERNESS
        </Link>

        <div aria-hidden="true" />

        <nav
          className="hidden items-center justify-center gap-1 border-l border-neutral-800 px-3 py-2 text-sm md:flex"
          aria-label="Hoofdnavigatie"
        >
          {navigatieItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 font-medium text-neutral-300 transition-all hover:bg-neutral-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex items-center justify-center border-l border-neutral-800 px-4 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white md:hidden"
          aria-expanded={mobielMenuOpen}
          aria-controls="mobiel-menu"
          aria-label={mobielMenuOpen ? "Menu sluiten" : "Menu openen"}
          onClick={wisselMobielMenu}
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {mobielMenuOpen ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {mobielMenuOpen && (
        <nav
          id="mobiel-menu"
          className="flex flex-col border-t border-neutral-800 bg-neutral-900 md:hidden"
          aria-label="Mobiele navigatie"
        >
          {navigatieItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-neutral-800/60 px-5 py-3.5 text-sm font-medium text-neutral-300 transition-colors last:border-b-0 hover:bg-neutral-800 hover:text-white"
              onClick={sluitMobielMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
