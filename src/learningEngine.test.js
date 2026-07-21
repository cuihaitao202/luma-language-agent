import test from "node:test";
import assert from "node:assert/strict";
import {
  createLearnerModel,
  learnerSnapshot,
  nextBestAction,
  recordEvidence,
  retrievability,
} from "./learningEngine.js";

test("evidence updates only the observed capability", () => {
  const model = createLearnerModel();
  const next = recordEvidence(model, { skill: "speaking", score: 0.9 });
  assert.ok(next.skills.speaking.estimate > model.skills.speaking.estimate);
  assert.equal(next.skills.listening.estimate, model.skills.listening.estimate);
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
