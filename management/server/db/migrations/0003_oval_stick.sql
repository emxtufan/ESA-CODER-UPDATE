CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "bank" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "number" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "data" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_number_uq" ON "contracts" USING btree ("number") WHERE "contracts"."number" is not null;