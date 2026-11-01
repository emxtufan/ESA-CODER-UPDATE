CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"meta" jsonb,
	"ip" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"success" boolean NOT NULL,
	"reason" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"ip" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"mfa_pending" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"role_id" uuid NOT NULL,
	"totp_secret_enc" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"totp_last_step" integer,
	"disabled_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"client_id" uuid,
	"actor_id" uuid,
	"actor_label" text,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"legal_name" text,
	"cui" text,
	"reg_com" text,
	"vat_status" text,
	"country" text,
	"city" text,
	"address" text,
	"postal_code" text,
	"website" text,
	"industry" text,
	"contact_person" text,
	"position" text,
	"phone" text,
	"primary_email" text,
	"billing_email" text,
	"payment_terms" text,
	"preferred_currency" text,
	"payment_method" text,
	"status" text,
	"internal_notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"email" text,
	"phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_id" uuid NOT NULL,
	"author_id" uuid,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"priority" text NOT NULL,
	"status" text,
	"converted_task_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_favorites" (
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_favorites_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"text" text NOT NULL,
	"commit_id" uuid,
	"deployment_id" uuid,
	"task_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"client_id" uuid NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"website_url" text,
	"admin_url" text,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"start_date" date,
	"deadline" date,
	"delivery_date" date,
	"contract_value" integer,
	"currency" text,
	"maintenance_status" text,
	"internal_notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_dependencies_task_id_depends_on_task_id_pk" PRIMARY KEY("task_id","depends_on_task_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_id" uuid NOT NULL,
	"client_id" uuid,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"due" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2),
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"project_id" uuid,
	"server_id" uuid,
	"username" text,
	"secret_enc" text NOT NULL,
	"url" text,
	"notes" text,
	"revoked_at" timestamp with time zone,
	"rotated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dns_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"ttl" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"registrar" text,
	"registration_date" date,
	"expiration_date" date,
	"auto_renewal" boolean DEFAULT false NOT NULL,
	"dns_provider" text,
	"nameservers" text[] DEFAULT '{}'::text[] NOT NULL,
	"project_id" uuid,
	"renewal_cost" integer,
	"currency" text,
	"status" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "hosting_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"plan" text,
	"monthly_cost" integer,
	"currency" text,
	"billing_cycle" text,
	"next_payment_date" date,
	"project_id" uuid,
	"payment_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_servers" (
	"project_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_servers_project_id_server_id_pk" PRIMARY KEY("project_id","server_id")
);
--> statement-breakpoint
CREATE TABLE "server_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" text,
	"port" integer,
	"status" text,
	"config_path" text,
	"project_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"ip" text,
	"os" text,
	"type" text NOT NULL,
	"ssh_port" integer,
	"ssh_username" text,
	"ssh_key_ref" text,
	"location" text,
	"cpu" text,
	"ram" text,
	"disk" text,
	"status" text,
	"purchase_date" date,
	"renewal_date" date,
	"monthly_cost" integer,
	"currency" text,
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ssl_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"issuer" text,
	"issue_date" date,
	"expiration_date" date,
	"auto_renewal" boolean DEFAULT false NOT NULL,
	"status" text,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"hash" text NOT NULL,
	"message" text,
	"author" text,
	"author_email" text,
	"date" timestamp with time zone,
	"branch" text,
	"files_changed" integer,
	"additions" integer,
	"deletions" integer,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"repository_id" uuid,
	"commit_hash" text,
	"branch" text,
	"environment" text,
	"server_id" uuid,
	"deployed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triggered_by_id" uuid,
	"status" text NOT NULL,
	"logs" text,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"title" text,
	"author" text,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"merged_at" timestamp with time zone,
	"head_ref" text,
	"base_ref" text,
	"url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"version" text NOT NULL,
	"tag" text NOT NULL,
	"notes" text,
	"date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"owner" text NOT NULL,
	"default_branch" text,
	"dev_branch" text,
	"prod_branch" text,
	"visibility" text,
	"last_sync_at" timestamp with time zone,
	"status" text,
	"project_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" text NOT NULL,
	"event" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_deliveries_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"supplier" text,
	"project_id" uuid,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"spent_at" timestamp with time zone NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"attachment_document_id" uuid,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit_price" integer NOT NULL,
	"vat_rate_bp" integer NOT NULL,
	"total" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"currency" text NOT NULL,
	"subtotal" integer NOT NULL,
	"vat" integer NOT NULL,
	"total" integer NOT NULL,
	"status" text NOT NULL,
	"file" text,
	"external_id" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"method" text,
	"reference" text,
	"notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid,
	"document_id" uuid,
	"title" text NOT NULL,
	"value" integer,
	"currency" text,
	"signed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text,
	"size" integer,
	"sha256" text,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"client_id" uuid,
	"project_id" uuid,
	"upload_date" date DEFAULT CURRENT_DATE NOT NULL,
	"expiration_date" date,
	"notes" text,
	"current_version_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_event_unique" UNIQUE("event")
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"project_id" uuid,
	"server_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"activity" text NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"performed_by_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"monthly_price" integer NOT NULL,
	"currency" text NOT NULL,
	"start_date" date,
	"renewal_date" date,
	"included_services" text[] DEFAULT '{}'::text[] NOT NULL,
	"frequency" text,
	"contract_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"interval_seconds" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_status" text,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"ok" boolean NOT NULL,
	"http_status" integer,
	"response_ms" integer,
	"ssl_expires_at" timestamp with time zone,
	"dns_ok" boolean,
	"error" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"recipient" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"frequency_minutes" integer,
	"max_retries" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_tokens" ADD CONSTRAINT "password_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_converted_task_id_tasks_id_fk" FOREIGN KEY ("converted_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_favorites" ADD CONSTRAINT "project_favorites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_favorites" ADD CONSTRAINT "project_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_commit_id_commits_id_fk" FOREIGN KEY ("commit_id") REFERENCES "public"."commits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dns_records" ADD CONSTRAINT "dns_records_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_services" ADD CONSTRAINT "hosting_services_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_servers" ADD CONSTRAINT "project_servers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_servers" ADD CONSTRAINT "project_servers_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_services" ADD CONSTRAINT "server_services_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_services" ADD CONSTRAINT "server_services_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ssl_certificates" ADD CONSTRAINT "ssl_certificates_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_triggered_by_id_users_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_attachment_document_id_documents_id_fk" FOREIGN KEY ("attachment_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_current_version_id_document_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."document_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_plan_id_maintenance_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."maintenance_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_checks" ADD CONSTRAINT "monitoring_checks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_check_id_monitoring_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."monitoring_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_at_idx" ON "audit_logs" USING btree ("at");--> statement-breakpoint
CREATE INDEX "login_history_user_id_idx" ON "login_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_history_email_idx" ON "login_history" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_history_at_idx" ON "login_history" USING btree ("at");--> statement-breakpoint
CREATE INDEX "password_tokens_user_id_idx" ON "password_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_name_idx" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "activities_project_id_idx" ON "activities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "activities_client_id_idx" ON "activities" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "activities_actor_id_idx" ON "activities" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activities_entity_idx" ON "activities" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activities_at_idx" ON "activities" USING btree ("at");--> statement-breakpoint
CREATE INDEX "attachments_entity_idx" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "attachments_document_id_idx" ON "attachments" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "clients_company_name_idx" ON "clients" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "clients_cui_idx" ON "clients" USING btree ("cui");--> statement-breakpoint
CREATE INDEX "clients_primary_email_idx" ON "clients" USING btree ("primary_email");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "comments_entity_idx" ON "comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comments_author_id_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "contacts_client_id_idx" ON "contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "observations_project_id_idx" ON "observations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "observations_author_id_idx" ON "observations" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "observations_status_idx" ON "observations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "observations_converted_task_id_idx" ON "observations" USING btree ("converted_task_id");--> statement-breakpoint
CREATE INDEX "project_favorites_user_id_idx" ON "project_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_updates_project_id_idx" ON "project_updates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_updates_commit_id_idx" ON "project_updates" USING btree ("commit_id");--> statement-breakpoint
CREATE INDEX "project_updates_deployment_id_idx" ON "project_updates" USING btree ("deployment_id");--> statement-breakpoint
CREATE INDEX "project_updates_task_id_idx" ON "project_updates" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "projects_client_id_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "projects_name_idx" ON "projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_type_idx" ON "projects" USING btree ("type");--> statement-breakpoint
CREATE INDEX "projects_priority_idx" ON "projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "projects_deadline_idx" ON "projects" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "task_dependencies_depends_on_task_id_idx" ON "task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "tasks_project_id_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_client_id_idx" ON "tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_priority_idx" ON "tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due");--> statement-breakpoint
CREATE INDEX "tasks_title_idx" ON "tasks" USING btree ("title");--> statement-breakpoint
CREATE INDEX "credentials_name_idx" ON "credentials" USING btree ("name");--> statement-breakpoint
CREATE INDEX "credentials_type_idx" ON "credentials" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credentials_project_id_idx" ON "credentials" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "credentials_server_id_idx" ON "credentials" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "credentials_revoked_at_idx" ON "credentials" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "dns_records_domain_id_idx" ON "dns_records" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "dns_records_type_idx" ON "dns_records" USING btree ("type");--> statement-breakpoint
CREATE INDEX "dns_records_name_idx" ON "dns_records" USING btree ("name");--> statement-breakpoint
CREATE INDEX "domains_project_id_idx" ON "domains" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "domains_expiration_date_idx" ON "domains" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "domains_status_idx" ON "domains" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domains_registrar_idx" ON "domains" USING btree ("registrar");--> statement-breakpoint
CREATE INDEX "hosting_services_project_id_idx" ON "hosting_services" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "hosting_services_provider_idx" ON "hosting_services" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "hosting_services_next_payment_date_idx" ON "hosting_services" USING btree ("next_payment_date");--> statement-breakpoint
CREATE INDEX "project_servers_server_id_idx" ON "project_servers" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "server_services_server_id_idx" ON "server_services" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "server_services_project_id_idx" ON "server_services" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "server_services_name_idx" ON "server_services" USING btree ("name");--> statement-breakpoint
CREATE INDEX "servers_name_idx" ON "servers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "servers_ip_idx" ON "servers" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "servers_provider_idx" ON "servers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "servers_type_idx" ON "servers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "servers_status_idx" ON "servers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "servers_renewal_date_idx" ON "servers" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "ssl_certificates_domain_id_idx" ON "ssl_certificates" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "ssl_certificates_expiration_date_idx" ON "ssl_certificates" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "ssl_certificates_status_idx" ON "ssl_certificates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "commits_repository_id_hash_idx" ON "commits" USING btree ("repository_id","hash");--> statement-breakpoint
CREATE INDEX "commits_hash_idx" ON "commits" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "commits_date_idx" ON "commits" USING btree ("date");--> statement-breakpoint
CREATE INDEX "commits_branch_idx" ON "commits" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "deployments_project_id_idx" ON "deployments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "deployments_repository_id_idx" ON "deployments" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "deployments_server_id_idx" ON "deployments" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "deployments_commit_hash_idx" ON "deployments" USING btree ("commit_hash");--> statement-breakpoint
CREATE INDEX "deployments_status_idx" ON "deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deployments_deployed_at_idx" ON "deployments" USING btree ("deployed_at");--> statement-breakpoint
CREATE INDEX "deployments_triggered_by_id_idx" ON "deployments" USING btree ("triggered_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pull_requests_repository_id_number_idx" ON "pull_requests" USING btree ("repository_id","number");--> statement-breakpoint
CREATE INDEX "pull_requests_number_idx" ON "pull_requests" USING btree ("number");--> statement-breakpoint
CREATE INDEX "pull_requests_status_idx" ON "pull_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "releases_repository_id_tag_idx" ON "releases" USING btree ("repository_id","tag");--> statement-breakpoint
CREATE INDEX "releases_date_idx" ON "releases" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_owner_name_idx" ON "repositories" USING btree ("owner","name");--> statement-breakpoint
CREATE INDEX "repositories_project_id_idx" ON "repositories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "repositories_name_idx" ON "repositories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_event_idx" ON "webhook_deliveries" USING btree ("event");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_received_at_idx" ON "webhook_deliveries" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rates_date_from_to_idx" ON "exchange_rates" USING btree ("date","from_currency","to_currency");--> statement-breakpoint
CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates" USING btree ("date");--> statement-breakpoint
CREATE INDEX "exchange_rates_from_currency_idx" ON "exchange_rates" USING btree ("from_currency");--> statement-breakpoint
CREATE INDEX "exchange_rates_to_currency_idx" ON "exchange_rates" USING btree ("to_currency");--> statement-breakpoint
CREATE INDEX "expenses_project_id_idx" ON "expenses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_spent_at_idx" ON "expenses" USING btree ("spent_at");--> statement-breakpoint
CREATE INDEX "expenses_supplier_idx" ON "expenses" USING btree ("supplier");--> statement-breakpoint
CREATE INDEX "expenses_currency_idx" ON "expenses" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "expenses_attachment_document_id_idx" ON "expenses" USING btree ("attachment_document_id");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_client_id_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoices_project_id_idx" ON "invoices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_issue_date_idx" ON "invoices" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "invoices_external_id_idx" ON "invoices" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "payments_method_idx" ON "payments" USING btree ("method");--> statement-breakpoint
CREATE INDEX "contracts_client_id_idx" ON "contracts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "contracts_project_id_idx" ON "contracts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "contracts_document_id_idx" ON "contracts" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contracts_expires_at_idx" ON "contracts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_document_id_version_idx" ON "document_versions" USING btree ("document_id","version");--> statement-breakpoint
CREATE INDEX "document_versions_uploaded_by_id_idx" ON "document_versions" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "document_versions_sha256_idx" ON "document_versions" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "documents_client_id_idx" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "documents_project_id_idx" ON "documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_name_idx" ON "documents" USING btree ("name");--> statement-breakpoint
CREATE INDEX "documents_current_version_id_idx" ON "documents" USING btree ("current_version_id");--> statement-breakpoint
CREATE INDEX "documents_expiration_date_idx" ON "documents" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "incidents_project_id_idx" ON "incidents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "incidents_server_id_idx" ON "incidents" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "incidents_started_at_idx" ON "incidents" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "maintenance_logs_plan_id_idx" ON "maintenance_logs" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "maintenance_logs_activity_idx" ON "maintenance_logs" USING btree ("activity");--> statement-breakpoint
CREATE INDEX "maintenance_logs_performed_at_idx" ON "maintenance_logs" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "maintenance_logs_performed_by_id_idx" ON "maintenance_logs" USING btree ("performed_by_id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_project_id_idx" ON "maintenance_plans" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_plan_idx" ON "maintenance_plans" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "maintenance_plans_renewal_date_idx" ON "maintenance_plans" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "maintenance_plans_contract_status_idx" ON "maintenance_plans" USING btree ("contract_status");--> statement-breakpoint
CREATE INDEX "monitoring_checks_project_id_idx" ON "monitoring_checks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "monitoring_checks_enabled_idx" ON "monitoring_checks" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "monitoring_checks_url_idx" ON "monitoring_checks" USING btree ("url");--> statement-breakpoint
CREATE INDEX "monitoring_results_check_id_idx" ON "monitoring_results" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "monitoring_results_at_idx" ON "monitoring_results" USING btree ("at");--> statement-breakpoint
CREATE INDEX "monitoring_results_ok_idx" ON "monitoring_results" USING btree ("ok");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_logs_dedupe_key_recipient_idx" ON "notification_logs" USING btree ("dedupe_key","recipient");--> statement-breakpoint
CREATE INDEX "notification_logs_event_idx" ON "notification_logs" USING btree ("event");--> statement-breakpoint
CREATE INDEX "notification_logs_status_idx" ON "notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_logs_sent_at_idx" ON "notification_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "notification_rules_event_idx" ON "notification_rules" USING btree ("event");--> statement-breakpoint
CREATE INDEX "notification_rules_enabled_idx" ON "notification_rules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");