import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const markdownFiles = [
  "README.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "docs/installation-zh.md",
  "docs/compatibility.md",
  "docs/migration-v1-v2.md",
  "docs/release-checklist.md",
];

test("all local Markdown links resolve to existing files", () => {
  for (const file of markdownFiles) {
    const content = readFileSync(file, "utf8");
    const links = [...content.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
    for (const link of links) {
      if (!link || /^(?:https?:|mailto:|#)/.test(link)) continue;
      const target = link.split("#", 1)[0];
      assert.ok(target && existsSync(resolve(dirname(file), target)), `${file} contains a broken link: ${link}`);
    }
  }
});

test("README documents every public command in both language sections", () => {
  const readme = readFileSync("README.md", "utf8");
  const chinese = readme.split("## English", 1)[0];
  const english = readme.slice(readme.indexOf("## English"));
  for (const command of ["menu", "setup", "check", "upgrade", "backup", "repair", "support"]) {
    const rowPattern = new RegExp("\\| `" + command + "` \\|");
    assert.match(chinese, rowPattern);
    assert.match(english, rowPattern);
  }
});
