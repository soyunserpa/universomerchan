ALTER TABLE "blog_posts" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "locale" varchar(5) DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "static_pages" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" varchar(5) DEFAULT 'es' NOT NULL;