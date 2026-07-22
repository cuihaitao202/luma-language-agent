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
  corpus_consent INTEGER NOT NULL DEFAULT 0,
  last_active_at INTEGER NOT NULL DEFAULT 0,
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
  hints INTEGER NOT NULL DEFAULT 0,
  response_latency_ms INTEGER,
  technique TEXT,
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

export const conversationCorpus = `
CREATE TABLE IF NOT EXISTS conversation_corpus (
  corpus_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  learner_text TEXT NOT NULL,
  coach_text TEXT NOT NULL,
  target_language TEXT,
  scenario TEXT,
  outcome_json TEXT NOT NULL DEFAULT '{}',
  consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (learner_id) REFERENCES learners(learner_id) ON DELETE CASCADE
)`;
