import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Technische log: schrijft meldingen naar my-app/logs/technisch.log.
// Een regel ziet er zo uit:
// 2026-10-30T12:00:00.000Z [FOUT] tickets.wijzigen: Ticket 5 wijzigen mislukt | Ticket 5 bestaat niet
const logMap = path.join(process.cwd(), "logs");
const logBestand = path.join(logMap, "technisch.log");

async function schrijfLog(niveau, bron, bericht, fout) {
  const regel = `${new Date().toISOString()} [${niveau}] ${bron}: ${bericht}${
    fout ? ` | ${fout.message}` : ""
  }`;

  // Altijd ook in de terminal, handig tijdens het ontwikkelen
  if (niveau === "FOUT") {
    console.error(regel);
  } else {
    console.log(regel);
  }

  // Lukt het schrijven naar het bestand niet, dan mag de applicatie daar nooit door stukgaan
  try {
    await mkdir(logMap, { recursive: true });
    await appendFile(logBestand, `${regel}\n`, "utf8");
  } catch (logFoutBericht) {
    console.error(
      "Technische log kon niet worden geschreven:",
      logFoutBericht.message,
    );
  }
}

// Logt een gebeurtenis die goed ging (bijv. "Ticket 5 gewijzigd")
export function logInfo(bron, bericht) {
  return schrijfLog("INFO", bron, bericht);
}

// Logt een fout, inclusief de technische foutmelding (die de gebruiker nooit te zien krijgt)
export function logFout(bron, bericht, fout) {
  return schrijfLog("FOUT", bron, bericht, fout);
}
