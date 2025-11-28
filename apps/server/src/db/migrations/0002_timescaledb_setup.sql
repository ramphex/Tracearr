-- TimescaleDB-specific setup for Tracearr
-- This migration converts sessions to hypertable and creates continuous aggregates

-- Step 1: Prepare sessions table for hypertable conversion
-- TimescaleDB requires the partition column in the primary key

-- Drop FK constraints from violations that reference sessions
ALTER TABLE "violations" DROP CONSTRAINT IF EXISTS "violations_session_id_sessions_id_fk";

-- Drop the existing primary key on sessions
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_pkey";

-- Add the new composite primary key including the partition column
ALTER TABLE "sessions" ADD PRIMARY KEY ("id", "started_at");

-- Convert sessions to hypertable partitioned by started_at
SELECT create_hypertable('sessions', 'started_at',
  chunk_time_interval => INTERVAL '7 days',
  migrate_data => true,
  if_not_exists => true
);

-- Re-add the FK constraint (we need to include started_at in the FK reference)
-- Since we can't have a simple FK from violations to a composite key hypertable,
-- we'll use a regular index for validation and handle referential integrity in app code
CREATE INDEX IF NOT EXISTS "violations_session_lookup_idx" ON "violations" ("session_id");

-- Step 2: Create continuous aggregates for dashboard stats

-- Daily plays by user
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_plays_by_user
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', started_at) AS day,
  user_id,
  COUNT(*) AS play_count,
  SUM(COALESCE(duration_ms, 0)) AS total_duration_ms
FROM sessions
GROUP BY day, user_id
WITH NO DATA;

-- Daily plays by platform
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_plays_by_platform
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', started_at) AS day,
  platform,
  COUNT(*) AS play_count,
  SUM(COALESCE(duration_ms, 0)) AS total_duration_ms
FROM sessions
GROUP BY day, platform
WITH NO DATA;

-- Hourly concurrent streams (for peak analysis)
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_concurrent_streams
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', started_at) AS hour,
  server_id,
  COUNT(*) AS stream_count
FROM sessions
WHERE state IN ('playing', 'paused')
GROUP BY hour, server_id
WITH NO DATA;

-- Step 3: Set up refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('daily_plays_by_user',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => true
);

SELECT add_continuous_aggregate_policy('daily_plays_by_platform',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => true
);

SELECT add_continuous_aggregate_policy('hourly_concurrent_streams',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes',
  if_not_exists => true
);

-- Step 4: Enable compression on sessions (for data older than 7 days)
ALTER TABLE sessions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'user_id, server_id'
);

SELECT add_compression_policy('sessions', INTERVAL '7 days', if_not_exists => true);

-- Step 5: Seed settings table with default values
INSERT INTO settings (id, allow_guest_access, notify_on_violation, notify_on_session_start, notify_on_session_stop, notify_on_server_down)
VALUES (1, false, true, false, false, true)
ON CONFLICT (id) DO NOTHING;
