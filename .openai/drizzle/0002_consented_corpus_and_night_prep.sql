ALTER TABLE learners ADD COLUMN corpus_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE learners ADD COLUMN last_active_at INTEGER NOT NULL DEFAULT 0;

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
);

CREATE INDEX IF NOT EXISTS conversation_corpus_learner_time_idx
  ON conversation_corpus (learner_id, created_at DESC);
