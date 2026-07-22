// Logical D1 schema for durable, privacy-minimized learner state.
// Runtime initialization mirrors this schema so a fresh deployment is usable
// before the first migration runner is available.
export const learners = `
CREATE TABLE IF NOT EXISTS learners (
  learner_id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  profile_json TEXT NOT NULL DEFAULT '{}',
  model_json TEXT NOT NULL DEFAULT '{}',
  prep_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

export const learningEvents = `
CREATE TABLE IF NOT EXISTS learning_events (
  event_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  skill TEXT,
  score REAL,
  hesitation REAL,
  transfer INTEGER NOT NULL DEFAULT 0,
  strategy TEXT,
  context TEXT,
  memory_key_hash TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
)`;

export const strategyOutcomes = `
CREATE TABLE IF NOT EXISTS strategy_outcomes (
  strategy TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  transfer_successes INTEGER NOT NULL DEFAULT 0,
  mean_score REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
)`;
