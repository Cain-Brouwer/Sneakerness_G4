import { voerQueryUit } from "../db.js";

// Demo-standen voor de ontwikkelomgeving. De NOT EXISTS-guard maakt het
// idempotent: herhaald initialiseren levert geen dubbele standen op.
const demoStands = [
  ["A01", "aa-plus"],
  ["A02", "aa"],
  ["A03", "a"],
  ["B01", "aa-plus"],
  ["B02", "aa"],
  ["S01", "side-stand"],
];

export async function voegStandDemoDataToe(database) {
  for (const [standnummer, standtype] of demoStands) {
    await voerQueryUit(
      database,
      `INSERT INTO Stand (Standnummer, Standtype)
       SELECT ?, ?
       WHERE NOT EXISTS (
           SELECT 1 FROM Stand WHERE Standnummer = ?
       )`,
      [standnummer, standtype, standnummer],
    );
  }
}