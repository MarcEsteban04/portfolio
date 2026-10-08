import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { getProject, projects } from "./projects.ts";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

test("shows Obsidian, Velora, Shipwright and the Vanderlyn ERP", () => {
  assert.deepEqual(
    projects.map((project) => project.slug),
    ["obsidian", "velora", "shipwright", "vanderlyn"],
  );
});

test("every icon and screenshot exists in public/", () => {
  for (const project of projects) {
    const files = [project.icon, ...project.screenshots.map((s) => s.src)];
    for (const file of files) {
      assert.ok(
        existsSync(publicDir + file),
        `${project.slug}: missing public${file}`,
      );
    }
  }
});

test("each project has screenshots with alt text and captions", () => {
  for (const project of projects) {
    assert.ok(project.screenshots.length >= 4, project.slug);
    for (const shot of project.screenshots) {
      assert.ok(shot.alt && shot.caption, `${project.slug}: ${shot.src}`);
    }
  }
});

test("private repos have no public link and are described in full", () => {
  const obsidian = getProject("obsidian");
  assert.equal(obsidian?.repo.visibility, "private");
  assert.ok(!("url" in obsidian.repo));
  assert.ok(obsidian.features.length > 0 && obsidian.details.length > 0);

  const shipwright = getProject("shipwright");
  assert.equal(shipwright?.repo.visibility, "private");
  assert.ok(!("url" in shipwright.repo));
  assert.ok(shipwright.features.length > 0 && shipwright.details.length > 0);

  const velora = getProject("velora");
  assert.deepEqual(velora?.repo, {
    visibility: "public",
    url: "https://github.com/MarcEsteban04/velora",
  });
});

test("an unknown slug has no project", () => {
  assert.equal(getProject("nope"), undefined);
});
