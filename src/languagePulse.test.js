import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pulse = JSON.parse(
  await readFile(new URL("../public/language-pulse.json", import.meta.url), "utf8"),
);

test("judge language locales have dated, usage-labeled language pulses", () => {
  for (const locale of ["en-US", "fr-FR", "fr-CA", "fr-BE", "fr-AF", "es-MX", "es-ES", "es-AR", "es-US"]) {
    const entry = pulse.locales[locale];
    assert.ok(entry, `missing ${locale}`);
    assert.ok(entry.updatedAt);
    assert.ok(entry.items.length > 0);
    for (const item of entry.items) {
      assert.ok(item.term && item.meaning);
      assert.ok(item.register && item.relationship && item.channel && item.age);
      assert.ok(item.caution && item.source && item.sourceUrl && item.sourceDate);
    }
  }
});

test("unobserved language is not mislabeled live", () => {
  for (const entry of Object.values(pulse.locales)) {
    if (entry.items.every((item) => !item.observedCount)) assert.equal(entry.live, false);
  }
});
