import { z } from "zod";

export const createProjectSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	description: z.string().max(500).optional(),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
		.optional(),
});

export const updateProjectSchema = z.object({
	projectId: z.string().uuid(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.optional(),
});

export const deleteProjectSchema = z.object({
	projectId: z.string().uuid(),
});

export const reorderProjectsSchema = z.object({
	projectId: z.string().uuid(),
	newPosition: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
