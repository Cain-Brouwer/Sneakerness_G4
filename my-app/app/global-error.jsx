"use client";

export default function GlobalError() {
  return (
    <html lang="nl">
      <body className="flex min-h-full items-center justify-center bg-black px-6 py-16 text-center text-white">
        <p role="alert">
          Er is een fout opgetreden. De pagina kon niet worden geladen.
        </p>
      </body>
    </html>
  );
}
