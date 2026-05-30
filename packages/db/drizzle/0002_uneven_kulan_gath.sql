ALTER TABLE "auth_users" ADD COLUMN "pending_email" text;--> statement-breakpoint
ALTER TABLE "auth_users" ADD COLUMN "force_sign_out_at" timestamp;