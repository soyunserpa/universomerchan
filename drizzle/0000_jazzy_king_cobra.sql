DO $$ BEGIN
 CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending_payment', 'paid', 'submitted', 'proof_pending', 'proof_approved', 'proof_rejected', 'in_production', 'shipped', 'completed', 'cancelled', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."order_type" AS ENUM('NORMAL', 'PRINT', 'SAMPLE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."proof_status" AS ENUM('not_applicable', 'in_progress', 'artwork_required', 'waiting_approval', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(300) NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"featured_image_url" text,
	"meta_title" varchar(200),
	"meta_description" varchar(300),
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"author_id" integer,
	"author_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(50) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_value" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"free_shipping" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_type" varchar(50) NOT NULL,
	"email_type" varchar(50) NOT NULL,
	"subject" varchar(300),
	"order_id" integer,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'sent'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "error_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"error_type" varchar(50) NOT NULL,
	"severity" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"order_id" integer,
	"user_id" integer,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"company_name" varchar(200),
	"industry" varchar(100),
	"budget" varchar(100),
	"objective" varchar(200),
	"volume" varchar(50),
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(200),
	"referer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"master_code" varchar(50) NOT NULL,
	"sku" varchar(50),
	"variant_id" varchar(50),
	"product_name" varchar(200),
	"color_description" varchar(50),
	"size" varchar(50),
	"quantity" integer NOT NULL,
	"unit_price_midocean" numeric(10, 4),
	"unit_price_sell" numeric(10, 4),
	"line_total" numeric(12, 2),
	"print_config" jsonb,
	"print_setup_cost" numeric(10, 2) DEFAULT '0',
	"print_cost" numeric(10, 2) DEFAULT '0',
	"print_handling_cost" numeric(10, 2) DEFAULT '0',
	"print_total_cost" numeric(10, 2) DEFAULT '0',
	"proof_status" "proof_status" DEFAULT 'not_applicable',
	"proof_url" text,
	"proof_approved_at" timestamp,
	"proof_rejected_at" timestamp,
	"proof_rejection_reason" text,
	"artwork_url" text,
	"mockup_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"user_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"order_type" "order_type" DEFAULT 'NORMAL' NOT NULL,
	"midocean_order_number" varchar(30),
	"midocean_po_number" varchar(50),
	"subtotal_product" numeric(12, 2) DEFAULT '0',
	"subtotal_print" numeric(12, 2) DEFAULT '0',
	"margin_product_applied" numeric(5, 2),
	"margin_print_applied" numeric(5, 2),
	"coupon_code" varchar(50),
	"discount_applied" numeric(5, 2) DEFAULT '0',
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"total_price" numeric(12, 2) DEFAULT '0',
	"stripe_payment_intent_id" varchar(100),
	"stripe_session_id" varchar(100),
	"paid_at" timestamp,
	"shipping_name" varchar(200),
	"shipping_company" varchar(200),
	"shipping_street" varchar(300),
	"shipping_postal_code" varchar(10),
	"shipping_city" varchar(100),
	"shipping_country" varchar(2) DEFAULT 'ES',
	"shipping_email" varchar(255),
	"shipping_phone" varchar(30),
	"express_shipping" boolean DEFAULT false,
	"tracking_number" varchar(100),
	"tracking_url" text,
	"forwarder" varchar(50),
	"shipped_at" timestamp,
	"customer_notes" text,
	"admin_notes" text,
	"last_error" text,
	"error_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "print_manipulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"master_code" varchar(50) NOT NULL,
	"handling_price_scales" jsonb NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "print_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"master_code" varchar(50) NOT NULL,
	"position_id" varchar(50) NOT NULL,
	"position_description" varchar(100),
	"max_print_width" numeric(8, 2),
	"max_print_height" numeric(8, 2),
	"print_position_image" text,
	"position_image_blank" text,
	"position_image_variants" jsonb,
	"position_points" jsonb,
	"available_techniques" jsonb NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "print_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"technique_id" varchar(50) NOT NULL,
	"technique_description" varchar(100),
	"pricing_type" varchar(50) NOT NULL,
	"setup" numeric(10, 2),
	"setup_repeat" numeric(10, 2),
	"next_colour_cost_indicator" boolean DEFAULT false,
	"var_costs" jsonb NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR',
	"pricelist_valid_from" varchar(50),
	"pricelist_valid_until" varchar(50),
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"master_code" varchar(50) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR',
	"pricelist_valid_from" varchar(50),
	"pricelist_valid_until" varchar(50),
	"price_scales" jsonb NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" varchar(50) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"color_description" varchar(50),
	"color_group" varchar(50),
	"color_code" varchar(50),
	"color_hex" varchar(7),
	"pms_color" varchar(50),
	"size" varchar(50),
	"gtin" varchar(50),
	"plc_status" varchar(50),
	"plc_status_description" varchar(50),
	"release_date" varchar(50),
	"digital_assets" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"master_code" varchar(50) NOT NULL,
	"master_id" varchar(50),
	"product_name" varchar(200) NOT NULL,
	"short_description" text,
	"long_description" text,
	"material" varchar(100),
	"dimensions" varchar(100),
	"commodity_code" varchar(50),
	"country_of_origin" varchar(5),
	"brand" varchar(50),
	"category_level1" varchar(100),
	"category_level2" varchar(100),
	"category_level3" varchar(100),
	"category_code" varchar(50),
	"printable" boolean DEFAULT false,
	"is_green" boolean DEFAULT false,
	"number_of_print_positions" integer DEFAULT 0,
	"digital_assets" jsonb,
	"is_visible" boolean DEFAULT true,
	"custom_price" numeric(10, 4),
	"custom_description" text,
	"print_manipulation" varchar(50),
	"last_synced_at" timestamp,
	"raw_api_data" jsonb,
	"translations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_master_code_unique" UNIQUE("master_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"step" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_number" varchar(30) NOT NULL,
	"user_id" integer,
	"guest_email" varchar(255),
	"cart_snapshot" jsonb NOT NULL,
	"total_price" numeric(12, 2),
	"pdf_url" text,
	"converted_to_order_id" integer,
	"converted_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" varchar(255) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"last_searched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_queries_query_unique" UNIQUE("query")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "static_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"meta_title" varchar(200),
	"meta_description" varchar(300),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "static_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(50) NOT NULL,
	"variant_id" integer,
	"quantity" integer DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_created" integer DEFAULT 0,
	"duration_ms" integer,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "traffic_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"source" varchar(100) NOT NULL,
	"medium" varchar(100),
	"campaign" varchar(200),
	"device_type" varchar(50),
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ucp_carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ucp_cart_id" varchar(255) NOT NULL,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'EUR',
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ucp_carts_ucp_cart_id_unique" UNIQUE("ucp_cart_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(30),
	"company_name" varchar(200),
	"cif" varchar(20),
	"shipping_street" varchar(300),
	"shipping_city" varchar(100),
	"shipping_postal_code" varchar(10),
	"shipping_country" varchar(2) DEFAULT 'ES',
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"email_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variant_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(50) NOT NULL,
	"variant_id" varchar(50) NOT NULL,
	"master_code" varchar(50) NOT NULL,
	"price" numeric(10, 4) NOT NULL,
	"price_scales" jsonb,
	"valid_until" varchar(50),
	"currency" varchar(3) DEFAULT 'EUR',
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_log" ADD CONSTRAINT "email_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_log" ADD CONSTRAINT "error_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_log" ADD CONSTRAINT "error_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_log" ADD CONSTRAINT "error_log_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_to_order_id_orders_id_fk" FOREIGN KEY ("converted_to_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock" ADD CONSTRAINT "stock_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_published_idx" ON "blog_posts" USING btree ("is_published");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupons_status_idx" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "errors_type_idx" ON "error_log" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "errors_resolved_idx" ON "error_log" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_lines_order_idx" ON "order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_midocean_idx" ON "orders" USING btree ("midocean_order_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "manipulations_master_code_idx" ON "print_manipulations" USING btree ("master_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "print_pos_master_code_idx" ON "print_positions" USING btree ("master_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "print_prices_technique_idx" ON "print_prices" USING btree ("technique_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prices_master_code_idx" ON "product_prices" USING btree ("master_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_variant_id_idx" ON "product_variants" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_master_code_idx" ON "products" USING btree ("master_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category_level1");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_visible_idx" ON "products" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_printable_idx" ON "products" USING btree ("printable");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_events_session_idx" ON "quiz_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_events_step_idx" ON "quiz_events" USING btree ("step");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_number_idx" ON "quotes" USING btree ("quote_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotes_user_idx" ON "quotes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "search_queries_query_idx" ON "search_queries" USING btree ("query");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_queries_count_idx" ON "search_queries" USING btree ("count");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "stock_sku_idx" ON "stock" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "traffic_sessions_source_idx" ON "traffic_sessions" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "traffic_sessions_created_at_idx" ON "traffic_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ucp_carts_id_idx" ON "ucp_carts" USING btree ("ucp_cart_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ucp_carts_status_idx" ON "ucp_carts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_product_idx" ON "user_favorites" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "variant_prices_sku_idx" ON "variant_prices" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variant_prices_variant_id_idx" ON "variant_prices" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variant_prices_master_code_idx" ON "variant_prices" USING btree ("master_code");