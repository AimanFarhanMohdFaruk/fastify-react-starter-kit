ALTER TABLE "demo_jobs" RENAME TO "reports";--> statement-breakpoint
ALTER TABLE "reports" RENAME CONSTRAINT "demo_jobs_user_id_user_id_fk" TO "reports_user_id_user_id_fk";
