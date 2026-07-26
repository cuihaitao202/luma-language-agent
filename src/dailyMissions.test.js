import test from "node:test";
import assert from "node:assert/strict";
import {
  assessComplexEnglish,
  englishDailyMissions,
  selectAdaptiveDailyMission,
  selectDailyMission,
  selectMissionTargets,
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

test("frequent searches and yesterday's weak points personalize the next mission", () => {
  const day = "2026-07-26";
  const model = {
    memories: {
      accum: {
        key: "accum",
        term: "accumulation",
        lookupCount: 4,
        lastSeenAt: Date.parse("2026-07-25T10:00:00Z"),
        lookup: {
          status: "resolved",
          detectedDomain: "quantitative software system",
          contextualMeaning: "a running accumulated value",
        },
      },
      hedge: {
        key: "hedge",
        phrase: "The evidence suggests…",
        lastScore: 0.3,
        lapses: 2,
        lastSeenAt: Date.parse("2026-07-25T08:00:00Z"),
        intent: "qualify a technical claim",
      },
    },
  };
  const targets = selectMissionTargets(model, day);
  assert.equal(targets[0].term, "accumulation");
  assert.equal(targets[0].seenYesterday, true);

  const mission = selectAdaptiveDailyMission(day, "English", model);
  assert.ok(technicalMissionIdsForTest.has(mission.id));
  assert.match(mission.prompt, /accumulation/);
  assert.equal(mission.personalization.primary.kind, "searched word");
});

const technicalMissionIdsForTest = new Set([
  "deadline-negotiation",
  "defend-recommendation",
  "explain-complex-idea",
  "polite-disagreement",
  "give-feedback",
  "choose-under-uncertainty",
]);
