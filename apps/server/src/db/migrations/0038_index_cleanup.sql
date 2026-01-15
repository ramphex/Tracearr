-- Drop unused indexes on sessions table
DROP INDEX IF EXISTS "sessions_geo_time_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sessions_top_movies_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sessions_top_shows_idx";--> statement-breakpoint
-- Covering index for history aggregates queries (server + date range + reference_id for COUNT DISTINCT)
CREATE INDEX IF NOT EXISTS "idx_sessions_server_date_ref" ON "sessions" USING btree ("server_id","started_at","reference_id");