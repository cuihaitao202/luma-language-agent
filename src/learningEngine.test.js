import test from "node:test";
import assert from "node:assert/strict";
import {
  createLearnerModel,
  learnerSnapshot,
  learningPlan,
  nextBestAction,
  practiceTechnique,
  recordEvidence,
  retrievability,
  saveContextualLookup,
} from "./learningEngine.js";

test("evidence updates only the observed capability", () => {
  const model = createLearnerModel();
  const next = recordEvidence(model, { skill: "speaking", score: 0.9 });
  assert.ok(next.skills.speaking.estimate > model.skills.speaking.estimate);
  assert.equal(next.skills.listening.estimate, model.skills.listening.estimate);
});

test("hints and slow retrieval reduce learning quality", () => {
  const base = createLearnerModel();
  const unaided = recordEvidence(base, {
    skill: "speaking", score: 0.85, memoryKey: "request", hints: 0, responseLatencyMs: 2200,
  }, 10_000);
  const prompted = recordEvidence(base, {
    skill: "speaking", score: 0.85, memoryKey: "request", hints: 2, responseLatencyMs: 14_000,
  }, 10_000);
  assert.ok(unaided.memories.request.stabilityHours > prompted.memories.request.stabilityHours);
  assert.ok(unaided.skills.speaking.estimate > prompted.skills.speaking.estimate);
});

test("practice changes from repair to interleaved transfer", () => {
  const weak = { lastSeenAt: 1_000, stabilityHours: 18, lastScore: 0.4, lapses: 2 };
  assert.equal(practiceTechnique(weak, "speaking", 2_000).mode, "listen-contrast-shadow-transfer");
  const strong = { lastSeenAt: 1_000, stabilityHours: 100, lastScore: 0.9, successfulRetrievals: 3 };
  assert.equal(practiceTechnique(strong, "reading", 2_000).mode, "interleaved-transfer");
});

test("late learning plans finish with a short successful retrieval", () => {
  const plan = learningPlan(createLearnerModel(), 1_000, 22);
  assert.equal(plan.beforeSleep, true);
  assert.equal(plan.steps.at(-1), "short-successful-bedtime-retrieval");
  assert.equal(plan.limits.correctionsPerTurn, 1);
});

test("a contextual lookup becomes a scheduled learning memory", () => {
  const model = saveContextualLookup(createLearnerModel(), {
    term: "verdict",
    detectedDomain: "quantitative trading",
    contextualMeaning: "the system's final decision or classification",
    naturalExample: "The model returned a bullish verdict.",
    commonCollocations: ["return a verdict", "bullish verdict"],
  }, 1_000);
  const memory = model.memories["lookup:verdict:quantitative trading"];
  assert.equal(memory.term, "verdict");
  assert.equal(memory.experiment.nextTest, "context-reconstruction");
  assert.equal(memory.nextDueAt, 1_000 + 8 * 36e5);
});

test("successful transfer expands stability and records contexts", () => {
  let model = createLearnerModel();
  model = recordEvidence(model, {
    skill: "speaking", score: 0.9, transfer: true, memoryKey: "hedge",
    phrase: "The evidence suggests…", context: "paper discussion",
  }, 1_000_000);
  assert.ok(model.memories.hedge.stabilityHours > 18);
  assert.deepEqual(model.memories.hedge.contexts, ["paper discussion"]);
});

test("forgotten memory becomes the next transfer retrieval", () => {
  let model = createLearnerModel();
  model = recordEvidence(model, {
    skill: "reading", score: 0.6, memoryKey: "qualify",
    phrase: "subject to", context: "technical paper",
  }, 1_000_000);
  const muchLater = 1_000_000 + 24 * 12 * 36e5;
  assert.ok(retrievability(model.memories.qualify, muchLater) < 0.62);
  assert.equal(nextBestAction(model, muchLater).mode, "transfer-retrieval");
  assert.equal(learnerSnapshot(model).domain, "daily life");
});
