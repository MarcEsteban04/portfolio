import assert from "node:assert/strict";
import { test } from "node:test";
import { pageMetadata, personJsonLd, siteUrl } from "./site.ts";

test("page metadata carries the title into its canonical link and share previews", () => {
  const meta = pageMetadata({ title: "Uses | Marc Esteban", description: "My setup.", path: "/uses" });
  assert.deepEqual(meta.alternates, { canonical: "/uses" });
  assert.equal((meta.openGraph as { title: string }).title, "Uses | Marc Esteban");
  assert.equal((meta.openGraph as { url: string }).url, "/uses");
  assert.equal((meta.twitter as { card: string }).card, "summary_large_image");
});

test("structured data describes Marc and the site", () => {
  const [person, website] = personJsonLd()["@graph"] as Record<string, unknown>[];
  assert.equal(person["@type"], "Person");
  assert.equal(person.name, "Marc Esteban");
  assert.equal(person.url, siteUrl);
  assert.deepEqual(person.sameAs, ["https://github.com/MarcEsteban04"]);
  assert.ok((person.knowsAbout as string[]).includes("Next.js"));
  assert.equal(website["@type"], "WebSite");
  assert.ok(siteUrl.startsWith("https://") && !siteUrl.endsWith("/"));
});
