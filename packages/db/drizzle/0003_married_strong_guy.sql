CREATE TYPE "public"."tasso_card_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TABLE "tasso_card_labels" (
	"card_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "tasso_card_labels_card_id_label_id_pk" PRIMARY KEY("card_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "tasso_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"column_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" "tasso_card_priority",
	"due_date" date,
	"position" varchar(255) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasso_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"position" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasso_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"position" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasso_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasso_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"position" varchar(255) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasso_card_labels" ADD CONSTRAINT "tasso_card_labels_card_id_tasso_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."tasso_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_card_labels" ADD CONSTRAINT "tasso_card_labels_label_id_tasso_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."tasso_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_cards" ADD CONSTRAINT "tasso_cards_column_id_tasso_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."tasso_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_cards" ADD CONSTRAINT "tasso_cards_project_id_tasso_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tasso_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_checklist_items" ADD CONSTRAINT "tasso_checklist_items_card_id_tasso_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."tasso_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_columns" ADD CONSTRAINT "tasso_columns_project_id_tasso_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tasso_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_labels" ADD CONSTRAINT "tasso_labels_project_id_tasso_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tasso_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasso_projects" ADD CONSTRAINT "tasso_projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasso_card_labels_card_id_idx" ON "tasso_card_labels" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "tasso_card_labels_label_id_idx" ON "tasso_card_labels" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "tasso_cards_project_id_idx" ON "tasso_cards" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasso_cards_column_id_idx" ON "tasso_cards" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "tasso_checklist_items_card_id_idx" ON "tasso_checklist_items" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "tasso_columns_project_id_idx" ON "tasso_columns" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasso_labels_project_id_idx" ON "tasso_labels" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasso_labels_project_name_idx" ON "tasso_labels" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "tasso_projects_workspace_id_idx" ON "tasso_projects" USING btree ("workspace_id");