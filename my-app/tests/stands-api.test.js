import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { GET } from "../app/api/stands/route.js";
import {
  initialiseerStandsDatabase,
  sluitStandsDatabase,
  voerStandQueryUit,
} from "../app/lib/stands-database.js";

let tijdelijkeMap;

const testStands = [
  ["A12", "aa-plus"],
  ["A13", "aa"],
  ["B04", "a"],
  ["S01", "side-stand"],
  ["S02", "side-stand"],
];

before(async () => {
  tijdelijkeMap = await mkdtemp(path.join(os.tmpdir(), "stands-api-"));
  process.env.STANDS_DATABASE_PATH = path.join(tijdelijkeMap, "test.sqlite");

  const database = await initialiseerStandsDatabase();

  try {
    for (const stand of testStands) {
      await voerStandQueryUit(
        database,
        "INSERT INTO stands (standnummer, standtype) VALUES (?, ?)",
        stand,
      );
    }
  } finally {
    await sluitStandsDatabase(database);
  }
});

after(async () => {
  delete process.env.STANDS_DATABASE_PATH;
  await rm(tijdelijkeMap, { recursive: true, force: true });
});

async function verstuurStandsRequest(query = "") {
  const response = await GET(new Request(`http://localhost/api/stands${query}`));
  return { response, inhoud: await response.json() };
}

test("happy: haalt alle stands op", async () => {
  const { response, inhoud } = await verstuurStandsRequest();

  assert.equal(response.status, 200);
  assert.equal(inhoud.length, testStands.length);
});

test("zoekt zonder hoofdlettergevoeligheid op standnummer", async () => {
  const { response, inhoud } = await verstuurStandsRequest("?zoek=a12");

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((stand) => stand.standnummer), ["A12"]);
});

for (const standtype of ["aa-plus", "aa", "a", "side-stand"]) {
  test(`filtert op geldig standtype '${standtype}'`, async () => {
    const { response, inhoud } = await verstuurStandsRequest(
      `?type=${standtype}`,
    );

    assert.equal(response.status, 200);
    assert.ok(inhoud.length > 0);
    assert.ok(inhoud.every((stand) => stand.standtype === standtype));
  });
}

test("combineert zoeken en filteren", async () => {
  const { response, inhoud } = await verstuurStandsRequest(
    "?zoek=A12&type=aa-plus",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud.map((stand) => stand.standnummer), ["A12"]);
});

test("empty: geeft een lege lijst zonder resultaten", async () => {
  const { response, inhoud } = await verstuurStandsRequest(
    "?zoek=bestaatniet",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(inhoud, []);
});

test("unhappy: weigert een ongeldig standtype", async () => {
  const { response, inhoud } = await verstuurStandsRequest(
    "?type=restaurant",
  );

  assert.equal(response.status, 400);
  assert.deepEqual(inhoud, { error: "Ongeldig type stand." });
});

test("stuurt alleen de afgesproken responsevelden terug", async () => {
  const { inhoud } = await verstuurStandsRequest("?zoek=A12");

  assert.deepEqual(Object.keys(inhoud[0]).sort(), [
    "id",
    "standnummer",
    "standtype",
  ]);
});
