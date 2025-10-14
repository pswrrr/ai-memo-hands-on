ALTER TABLE "auth.users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "auth.users" CASCADE;--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_user_id_auth.users_id_fk";
