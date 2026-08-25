CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contributions" ALTER COLUMN "submitted_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contributions" ALTER COLUMN "reviewed_by" SET DATA TYPE text;