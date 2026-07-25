import test from "node:test";
import assert from "node:assert/strict";
import {
  assessComplexEnglish,
  englishDailyMissions,
  selectDailyMission,
} from "./dailyMissions.js";

test("daily English missions rotate across real situations", () => {
  const first = selectDailyMission("2026-07-26", "English");
  const second = selectDailyMission("2026-07-27", "English");
  assert.notEqual(first.id, second.id);
  assert.ok(englishDailyMissions.length >= 8);
  assert.notEqual(first.scene, "Coffee shop");
});

test("one-word escape answers are blocked", () => {
  assert.equal(assessComplexEnglish("yes").ready, false);
  assert.equal(assessComplexEnglish("I don't know").escape, true);
});

test("a reasoned multi-clause answer is accepted", () => {
  const result = assessComplexEnglish(
    "I recommend the safer option because it reduces integration risk, although it costs more initially.",
  );
  assert.equal(result.ready, true);
});
