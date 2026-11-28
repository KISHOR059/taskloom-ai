import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).default("Untitled Note"),
  content: z.string().max(50_000).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  pinned: z.boolean().default(false),
  noteDate: z.coerce.date().nullable().optional(),
  linkedTaskIds: z.array(z.string().trim().min(1)).max(50).default([]),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(40).optional(),
  pinned: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const extractTasksBodySchema = z.object({
  content: z.string().max(50_000).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteListQueryInput = z.infer<typeof noteListQuerySchema>;
export type ExtractTasksBodyInput = z.infer<typeof extractTasksBodySchema>;
