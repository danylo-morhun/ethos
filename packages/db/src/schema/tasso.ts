import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./midas";

export const tassoCardPriorityEnum = pgEnum("tasso_card_priority", [
	"low",
	"medium",
	"high",
	"urgent",
]);

export const tassoProjects = pgTable(
	"tasso_projects",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		color: text("color"),
		position: varchar("position", { length: 255 }).notNull(),
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("tasso_projects_workspace_id_idx").on(t.workspaceId)],
);

export const tassoColumns = pgTable(
	"tasso_columns",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => tassoProjects.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color"),
		position: varchar("position", { length: 255 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("tasso_columns_project_id_idx").on(t.projectId)],
);

export const tassoCards = pgTable(
	"tasso_cards",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		columnId: uuid("column_id")
			.notNull()
			.references(() => tassoColumns.id, { onDelete: "cascade" }),
		projectId: uuid("project_id")
			.notNull()
			.references(() => tassoProjects.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description"),
		priority: tassoCardPriorityEnum("priority"),
		dueDate: date("due_date"),
		position: varchar("position", { length: 255 }).notNull(),
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("tasso_cards_project_id_idx").on(t.projectId),
		index("tasso_cards_column_id_idx").on(t.columnId),
	],
);

export const tassoChecklistItems = pgTable(
	"tasso_checklist_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		cardId: uuid("card_id")
			.notNull()
			.references(() => tassoCards.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		isCompleted: boolean("is_completed").notNull().default(false),
		position: varchar("position", { length: 255 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("tasso_checklist_items_card_id_idx").on(t.cardId)],
);

export const tassoLabels = pgTable(
	"tasso_labels",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => tassoProjects.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color").notNull(),
	},
	(t) => [
		index("tasso_labels_project_id_idx").on(t.projectId),
		uniqueIndex("tasso_labels_project_name_idx").on(t.projectId, t.name),
	],
);

export const tassoCardLabels = pgTable(
	"tasso_card_labels",
	{
		cardId: uuid("card_id")
			.notNull()
			.references(() => tassoCards.id, { onDelete: "cascade" }),
		labelId: uuid("label_id")
			.notNull()
			.references(() => tassoLabels.id, { onDelete: "cascade" }),
	},
	(t) => [
		primaryKey({ columns: [t.cardId, t.labelId] }),
		index("tasso_card_labels_card_id_idx").on(t.cardId),
		index("tasso_card_labels_label_id_idx").on(t.labelId),
	],
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const tassoProjectsRelations = relations(tassoProjects, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [tassoProjects.workspaceId],
		references: [workspaces.id],
	}),
	columns: many(tassoColumns),
	cards: many(tassoCards),
	labels: many(tassoLabels),
}));

export const tassoColumnsRelations = relations(tassoColumns, ({ one, many }) => ({
	project: one(tassoProjects, {
		fields: [tassoColumns.projectId],
		references: [tassoProjects.id],
	}),
	cards: many(tassoCards),
}));

export const tassoCardsRelations = relations(tassoCards, ({ one, many }) => ({
	column: one(tassoColumns, {
		fields: [tassoCards.columnId],
		references: [tassoColumns.id],
	}),
	project: one(tassoProjects, {
		fields: [tassoCards.projectId],
		references: [tassoProjects.id],
	}),
	checklistItems: many(tassoChecklistItems),
	cardLabels: many(tassoCardLabels),
}));

export const tassoChecklistItemsRelations = relations(tassoChecklistItems, ({ one }) => ({
	card: one(tassoCards, {
		fields: [tassoChecklistItems.cardId],
		references: [tassoCards.id],
	}),
}));

export const tassoLabelsRelations = relations(tassoLabels, ({ one, many }) => ({
	project: one(tassoProjects, {
		fields: [tassoLabels.projectId],
		references: [tassoProjects.id],
	}),
	cardLabels: many(tassoCardLabels),
}));

export const tassoCardLabelsRelations = relations(tassoCardLabels, ({ one }) => ({
	card: one(tassoCards, {
		fields: [tassoCardLabels.cardId],
		references: [tassoCards.id],
	}),
	label: one(tassoLabels, {
		fields: [tassoCardLabels.labelId],
		references: [tassoLabels.id],
	}),
}));
