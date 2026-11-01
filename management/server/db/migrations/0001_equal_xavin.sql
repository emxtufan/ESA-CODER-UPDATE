ALTER TABLE "deployments" ADD COLUMN "external_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "deployments_external_id_idx" ON "deployments" USING btree ("external_id");