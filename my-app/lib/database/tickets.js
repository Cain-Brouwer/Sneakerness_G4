import {
  haalRijenOp,
  initialiseerDatabase,
  sluitDatabase,
  voerQueryUit,
} from "./db.js";

// Fout met een melding die de bezoeker mag zien (bijv. "Dit ticket is uitverkocht.").
// Alle andere fouten zijn systeemfouten en krijgen een algemene melding.
export class BestellingFout extends Error {}

// Haalt alle tickettypes op uit de database (voor de dropdown).
export async function getTicketTypes() {
  const database = await initialiseerDatabase();

  try {
    return await haalRijenOp(
      database,
      "SELECT id, Naam FROM tickettypes ORDER BY id",
    );
  } finally {
    await sluitDatabase(database);
  }
}

// Slaat een contactpersoon-toevoegen ticket op in de database en geeft het id van het nieuwe ticket terug.
export async function createTicket(ticket) {
  const database = await initialiseerDatabase();

  try {
    const resultaat = await voerQueryUit(
      database,
      `INSERT INTO tickets
          (Ticketnaam, TickettypeId, Prijs, AantalBeschikbaar, Evenementdatum, Beschrijving, Datumaangemaakt, Datumgewijzigd)
       VALUES (?, ?, ?, ?, ?, ?, DATE('now'), DATE('now'))`,
      [
        ticket.ticketnaam,
        ticket.tickettypeId,
        ticket.prijs,
        ticket.aantalBeschikbaar,
        ticket.evenementdatum,
        ticket.beschrijving,
      ],
    );

    return resultaat.id;
  } finally {
    await sluitDatabase(database);
  }
}

// Haalt alle tickets op voor het ticketoverzicht, inclusief de naam van het tickettype.
// Gesorteerd op datum en tijdslot; tickets zonder tijdslot (hele dag) komen per dag als laatste.
export async function getTicketOverview() {
  const database = await initialiseerDatabase();

  try {
    return await haalRijenOp(
      database,
      `SELECT t.id,
              t.Ticketnaam,
              tt.Naam AS Tickettype,
              t.Prijs,
              t.AantalBeschikbaar,
              t.Evenementdatum,
              t.Tijdslot
       FROM tickets t
       JOIN tickettypes tt ON tt.id = t.TickettypeId
       ORDER BY t.Evenementdatum, t.Tijdslot IS NULL, t.Tijdslot, t.id`,
    );
  } finally {
    await sluitDatabase(database);
  }
}

// Haalt de tickets op die nog te koop zijn (minstens 1 beschikbaar) voor het stappenplan
// "Tickets kopen". Uitverkochte tickets worden niet getoond.
export async function getTicketsVoorVerkoop() {
  const database = await initialiseerDatabase();

  try {
    return await haalRijenOp(
      database,
      `SELECT t.id,
              t.Ticketnaam,
              t.Beschrijving,
              tt.Naam AS Tickettype,
              t.Prijs,
              t.AantalBeschikbaar,
              t.Evenementdatum,
              t.Tijdslot
       FROM tickets t
       JOIN tickettypes tt ON tt.id = t.TickettypeId
       WHERE t.AantalBeschikbaar > 0
       ORDER BY t.Evenementdatum, t.Tijdslot IS NULL, t.Tijdslot, t.id`,
    );
  } finally {
    await sluitDatabase(database);
  }
}

// Maakt de tabel voor bestellingen aan als die er nog niet is.
async function zorgVoorBestellingTabel(database) {
  await voerQueryUit(
    database,
    `CREATE TABLE IF NOT EXISTS ticketbestellingen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        TicketId INTEGER NOT NULL REFERENCES tickets (id),
        Naam TEXT NOT NULL,
        Email TEXT NOT NULL,
        Aantal INTEGER NOT NULL CHECK (Aantal > 0),
        TotaalCenten INTEGER NOT NULL CHECK (TotaalCenten >= 0),
        Datumaangemaakt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  );
}

// Registreert een bestelling en verlaagt het aantal beschikbare tickets.
// Alles gebeurt in één transactie: lukt er iets niet, dan wordt er niets opgeslagen.
export async function koopTicket({ ticketId, naam, email, aantal }) {
  const database = await initialiseerDatabase();

  try {
    await zorgVoorBestellingTabel(database);
    await voerQueryUit(database, "BEGIN IMMEDIATE");

    try {
      const rijen = await haalRijenOp(
        database,
        "SELECT id, Ticketnaam, Prijs, AantalBeschikbaar FROM tickets WHERE id = ?",
        [ticketId],
      );
      const ticket = rijen[0];

      if (!ticket) {
        throw new BestellingFout(
          "Dit ticket bestaat niet meer. Kies een ander ticket.",
        );
      }
      if (ticket.AantalBeschikbaar <= 0) {
        throw new BestellingFout("Dit ticket is helaas uitverkocht.");
      }
      if (ticket.AantalBeschikbaar < aantal) {
        throw new BestellingFout(
          ticket.AantalBeschikbaar === 1
            ? "Er is nog maar 1 ticket beschikbaar. Kies een lager aantal."
            : `Er zijn nog maar ${ticket.AantalBeschikbaar} tickets beschikbaar. Kies een lager aantal.`,
        );
      }

      // Bedragen rekenen we in centen om afrondingsverschillen te voorkomen.
      const totaalCenten = Math.round(ticket.Prijs * 100) * aantal;

      const bestelling = await voerQueryUit(
        database,
        `INSERT INTO ticketbestellingen (TicketId, Naam, Email, Aantal, TotaalCenten)
         VALUES (?, ?, ?, ?, ?)`,
        [ticketId, naam, email, aantal, totaalCenten],
      );

      const bijgewerkt = await voerQueryUit(
        database,
        `UPDATE tickets
         SET AantalBeschikbaar = AantalBeschikbaar - ?, Datumgewijzigd = DATE('now')
         WHERE id = ? AND AantalBeschikbaar >= ?`,
        [aantal, ticketId, aantal],
      );
      if (bijgewerkt.wijzigingen !== 1) {
        throw new Error("Voorraad bijwerken mislukt");
      }

      await voerQueryUit(database, "COMMIT");
      return { id: bestelling.id, ticketnaam: ticket.Ticketnaam, totaalCenten };
    } catch (fout) {
      await voerQueryUit(database, "ROLLBACK");
      throw fout;
    }
  } finally {
    await sluitDatabase(database);
  }
}

// Past de gegevens van een bestaand ticket aan en zet Datumgewijzigd op vandaag (PBI 372).
// Gooit een fout als er geen ticket met dit id is, zodat er nooit "stil" niets gebeurt.
export async function updateTicket(id, ticket) {
  const database = await initialiseerDatabase();

  try {
    const resultaat = await voerQueryUit(
      database,
      `UPDATE tickets
       SET Ticketnaam = ?,
           TickettypeId = ?,
           Prijs = ?,
           AantalBeschikbaar = ?,
           Evenementdatum = ?,
           Beschrijving = ?,
           Datumgewijzigd = DATE('now')
       WHERE id = ?`,
      [
        ticket.ticketnaam,
        ticket.tickettypeId,
        ticket.prijs,
        ticket.aantalBeschikbaar,
        ticket.evenementdatum,
        ticket.beschrijving,
        id,
      ],
    );

    if (resultaat.wijzigingen !== 1) {
      throw new Error(`Ticket ${id} bestaat niet`);
    }
  } finally {
    await sluitDatabase(database);
  }
}
