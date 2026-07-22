ALTER TABLE learning_events ADD COLUMN hints INTEGER NOT NULL DEFAULT 0;
ALTER TABLE learning_events ADD COLUMN response_latency_ms INTEGER;
ALTER TABLE learning_events ADD COLUMN technique TEXT;

CREATE INDEX IF NOT EXISTS learning_events_strategy_technique_idx
  ON learning_events (strategy, technique, created_at DESC);
