CREATE TABLE "rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"params" jsonb NOT NULL,
	"user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"url" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_key" varchar(255) NOT NULL,
	"state" varchar(20) NOT NULL,
	"media_type" varchar(20) NOT NULL,
	"media_title" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stopped_at" timestamp with time zone,
	"duration_ms" integer,
	"ip_address" varchar(45) NOT NULL,
	"geo_city" varchar(255),
	"geo_country" varchar(100),
	"geo_lat" real,
	"geo_lon" real,
	"player_name" varchar(255),
	"platform" varchar(100),
	"quality" varchar(100),
	"is_transcode" boolean DEFAULT false NOT NULL,
	"bitrate" integer
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"allow_guest_access" boolean DEFAULT false NOT NULL,
	"discord_webhook_url" text,
	"custom_webhook_url" text,
	"notify_on_violation" boolean DEFAULT true NOT NULL,
	"notify_on_session_start" boolean DEFAULT false NOT NULL,
	"notify_on_session_stop" boolean DEFAULT false NOT NULL,
	"notify_on_server_down" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255),
	"thumb_url" text,
	"is_owner" boolean DEFAULT false NOT NULL,
	"allow_guest" boolean DEFAULT false NOT NULL,
	"trust_score" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"severity" varchar(20) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rules_active_idx" ON "rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rules_user_id_idx" ON "rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_time_idx" ON "sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "sessions_server_time_idx" ON "sessions" USING btree ("server_id","started_at");--> statement-breakpoint
CREATE INDEX "sessions_state_idx" ON "sessions" USING btree ("state");--> statement-breakpoint
CREATE INDEX "users_server_id_idx" ON "users" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "users_external_id_idx" ON "users" USING btree ("server_id","external_id");--> statement-breakpoint
CREATE INDEX "violations_user_id_idx" ON "violations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "violations_rule_id_idx" ON "violations" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "violations_created_at_idx" ON "violations" USING btree ("created_at");