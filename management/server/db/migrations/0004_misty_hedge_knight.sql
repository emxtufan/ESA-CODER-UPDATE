CREATE TABLE "catalog_categories" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "catalog_package_items" (
	"package_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "catalog_package_items_package_id_service_id_pk" PRIMARY KEY("package_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"billing" text DEFAULT 'one_time' NOT NULL,
	"recommended_price" integer,
	"currency" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_packages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "catalog_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"category_code" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"deliverables" text DEFAULT '' NOT NULL,
	"acceptance" text DEFAULT '' NOT NULL,
	"unit" text DEFAULT 'serviciu' NOT NULL,
	"default_quantity" numeric(12, 3) DEFAULT 1 NOT NULL,
	"recommended_price" integer,
	"currency" text,
	"billing" text DEFAULT 'one_time' NOT NULL,
	"default_periods" integer DEFAULT 1 NOT NULL,
	"default_status" text DEFAULT 'accepted' NOT NULL,
	"advanced" boolean DEFAULT false NOT NULL,
	"duration" text DEFAULT '' NOT NULL,
	"conditions" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_services_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dossier_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"number" text,
	"offer_id" uuid NOT NULL,
	"contract_id" uuid,
	"client_id" uuid NOT NULL,
	"date" date NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"data" jsonb NOT NULL,
	"totals" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"kind" text DEFAULT 'offer' NOT NULL,
	"parent_offer_id" uuid,
	"contract_id" uuid,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"date" date NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"currency" text NOT NULL,
	"net_total" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"totals" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sent_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "catalog_package_items" ADD CONSTRAINT "catalog_package_items_package_id_catalog_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."catalog_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_package_items" ADD CONSTRAINT "catalog_package_items_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_services" ADD CONSTRAINT "catalog_services_category_code_catalog_categories_code_fk" FOREIGN KEY ("category_code") REFERENCES "public"."catalog_categories"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_documents" ADD CONSTRAINT "dossier_documents_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_documents" ADD CONSTRAINT "dossier_documents_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_documents" ADD CONSTRAINT "dossier_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_documents" ADD CONSTRAINT "dossier_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_parent_offer_id_offers_id_fk" FOREIGN KEY ("parent_offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_package_items_service_idx" ON "catalog_package_items" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "catalog_services_category_idx" ON "catalog_services" USING btree ("category_code");--> statement-breakpoint
CREATE INDEX "catalog_services_name_idx" ON "catalog_services" USING btree ("name");--> statement-breakpoint
CREATE INDEX "dossier_documents_offer_idx" ON "dossier_documents" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "dossier_documents_client_idx" ON "dossier_documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "dossier_documents_type_number_idx" ON "dossier_documents" USING btree ("type","number");--> statement-breakpoint
CREATE UNIQUE INDEX "dossier_documents_offer_type_version_uq" ON "dossier_documents" USING btree ("offer_id","type","version");--> statement-breakpoint
CREATE UNIQUE INDEX "offer_versions_offer_version_uq" ON "offer_versions" USING btree ("offer_id","version");--> statement-breakpoint
CREATE INDEX "offers_client_id_idx" ON "offers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "offers_contract_id_idx" ON "offers" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "offers_parent_idx" ON "offers" USING btree ("parent_offer_id");--> statement-breakpoint
CREATE INDEX "offers_status_idx" ON "offers" USING btree ("status");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contracts_offer_id_idx" ON "contracts" USING btree ("offer_id");