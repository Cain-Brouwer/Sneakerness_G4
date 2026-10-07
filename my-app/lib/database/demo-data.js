import { voegContactpersoonDemoDataToe } from "./demo-data/contactpersonen-demo-data.js";
import { voegStandDemoDataToe } from "./demo-data/stands-demo-data.js";
import { voegVerkoperDemoDataToe } from "./demo-data/verkopers-demo-data.js";

// Vult alle tabellen met demo-data. Elke tabel heeft een eigen module zodat
// demo-data per domein kan worden uitgebreid zonder andere tabellen te raken.
export async function voegDemoDataToe(database) {
  await voegStandDemoDataToe(database);
  await voegVerkoperDemoDataToe(database);
  await voegContactpersoonDemoDataToe(database);
}