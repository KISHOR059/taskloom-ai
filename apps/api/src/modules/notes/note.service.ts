import { Types } from "mongoose";

import { NotFoundError, ValidationError } from "../../utils/app-error.js";
import { createAIProvider } from "../ai/providers/provider.factory.js";
import type { PublicUser } from "../auth/auth.types.js";
import { taskService } from "../tasks/task.container.js";
import { TaskPriority, TaskStatus } from "../tasks/task.model.js";
import type { PublicTask } from "../tasks/task.service.js";
import { NoteModel, type NoteDocument } from "./note.model.js";
import type {
  CreateNoteInput,
  NoteListQueryInput,
  UpdateNoteInput,
} from "./note.validation.js";

export interface PublicNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  noteDate?: string;
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ExtractedTaskItem {
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  dueDate?: unknown;
  estimatedMinutes?: unknown;
  tags?: unknown;
}

function toPublicNote(note: NoteDocument): PublicNote {
  return {
    id: note._id.toString(),
    userId: note.userId.toString(),
    title: note.title,
    content: note.content,
    tags: note.tags,
    pinned: note.pinned,
    ...(note.noteDate ? { noteDate: note.noteDate.toISOString() } : {}),
    linkedTaskIds: note.linkedTaskIds.map((id) => id.toString()),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

function assertObjectId(id: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError(`A valid ${label} is required`);
  }
  return new Types.ObjectId(id);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePriority(value: unknown): TaskPriority {
  if (typeof value !== "string") return TaskPriority.MEDIUM;
  const upper = value.trim().toUpperCase();
  if (upper === TaskPriority.LOW) return TaskPriority.LOW;
  if (upper === TaskPriority.HIGH) return TaskPriority.HIGH;
  if (upper === TaskPriority.URGENT) return TaskPriority.URGENT;
  return TaskPriority.MEDIUM;
}

function parseExtractedTasks(rawText: string): ExtractedTaskItem[] {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as { tasks?: unknown } | unknown[];
  if (Array.isArray(parsed)) {
    return parsed as ExtractedTaskItem[];
  }
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.tasks)) {
    return parsed.tasks as ExtractedTaskItem[];
  }
  return [];
}

export class NoteService {
  public async list(
    user: PublicUser,
    query: NoteListQueryInput,
  ): Promise<PublicNote[]> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(user.id),
    };

    if (typeof query.pinned === "boolean") {
      filter.pinned = query.pinned;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const notes = await NoteModel.find(filter)
      .sort({ pinned: -1, updatedAt: -1 })
      .exec();

    return notes.map(toPublicNote);
  }

  public async getById(user: PublicUser, noteId: string): Promise<PublicNote> {
    const _id = assertObjectId(noteId, "note ID");
    const note = await NoteModel.findOne({
      _id,
      userId: new Types.ObjectId(user.id),
    }).exec();

    if (!note) {
      throw new NotFoundError("Note not found");
    }

    return toPublicNote(note);
  }

  public async create(
    user: PublicUser,
    input: CreateNoteInput,
  ): Promise<PublicNote> {
    const linkedTaskIds = input.linkedTaskIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const note = await NoteModel.create({
      userId: new Types.ObjectId(user.id),
      title: input.title,
      content: input.content,
      tags: input.tags,
      pinned: input.pinned,
      ...(input.noteDate ? { noteDate: input.noteDate } : {}),
      linkedTaskIds,
    });

    return toPublicNote(note);
  }

  public async update(
    user: PublicUser,
    noteId: string,
    input: UpdateNoteInput,
  ): Promise<PublicNote> {
    const _id = assertObjectId(noteId, "note ID");
    const updateOps: Record<string, unknown> = {};
    const unsetOps: Record<string, 1> = {};

    if (input.title !== undefined) updateOps.title = input.title;
    if (input.content !== undefined) updateOps.content = input.content;
    if (input.tags !== undefined) updateOps.tags = input.tags;
    if (input.pinned !== undefined) updateOps.pinned = input.pinned;

    if (input.noteDate === null) {
      unsetOps.noteDate = 1;
    } else if (input.noteDate !== undefined) {
      updateOps.noteDate = input.noteDate;
    }

    if (input.linkedTaskIds !== undefined) {
      updateOps.linkedTaskIds = input.linkedTaskIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
    }

    const mongoUpdate: Record<string, unknown> = {};
    if (Object.keys(updateOps).length > 0) mongoUpdate.$set = updateOps;
    if (Object.keys(unsetOps).length > 0) mongoUpdate.$unset = unsetOps;

    const note = await NoteModel.findOneAndUpdate(
      { _id, userId: new Types.ObjectId(user.id) },
      Object.keys(mongoUpdate).length > 0 ? mongoUpdate : { $set: {} },
      { new: true },
    ).exec();

    if (!note) {
      throw new NotFoundError("Note not found");
    }

    return toPublicNote(note);
  }

  public async remove(user: PublicUser, noteId: string): Promise<void> {
    const _id = assertObjectId(noteId, "note ID");
    const deleted = await NoteModel.findOneAndDelete({
      _id,
      userId: new Types.ObjectId(user.id),
    }).exec();

    if (!deleted) {
      throw new NotFoundError("Note not found");
    }
  }

  public async extractTasks(
    user: PublicUser,
    noteId: string,
    overrideContent?: string,
  ): Promise<{ tasks: PublicTask[]; note: PublicNote }> {
    const _id = assertObjectId(noteId, "note ID");
    const note = await NoteModel.findOne({
      _id,
      userId: new Types.ObjectId(user.id),
    }).exec();

    if (!note) {
      throw new NotFoundError("Note not found");
    }

    const sourceContent = (overrideContent ?? note.content).trim();
    if (!sourceContent) {
      throw new ValidationError(
        "Note content is empty. Write some meeting notes or ideas first.",
      );
    }

    const todayIso = new Date().toISOString().split("T")[0];
    const prompt = [
      "Extract actionable tasks from the user's meeting notes or scratchpad.",
      `Today's date is ${todayIso}.`,
      "Return ONLY valid JSON matching this schema:",
      '{ "tasks": [ { "title": "string (max 180 chars)", "description": "string (optional)", "priority": "LOW|MEDIUM|HIGH|URGENT", "dueDate": "ISO-8601 date string or null", "estimatedMinutes": number or null, "tags": ["string"] } ] }',
      "Rules:",
      "- Only include concrete, actionable tasks or follow-ups.",
      "- Infer priority from urgency words (e.g. ASAP/urgent/blocker -> HIGH or URGENT).",
      "- If a relative date like 'tomorrow' or 'Friday' is mentioned, resolve it to an ISO-8601 date string.",
      "- Keep titles concise and imperative.",
      "",
      `Note Title: ${note.title}`,
      "Note Content:",
      sourceContent,
    ].join("\n");

    const aiProvider = createAIProvider();
    const response = await aiProvider.generateText({
      input: prompt,
      temperature: 0.2,
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
    });

    let rawItems: ExtractedTaskItem[] = [];
    try {
      rawItems = parseExtractedTasks(response.text);
    } catch {
      throw new ValidationError(
        "Could not parse extracted tasks from AI response. Please try again.",
      );
    }

    const validItems = rawItems
      .filter(
        (item) => typeof item.title === "string" && item.title.trim().length > 0,
      )
      .slice(0, 15);

    if (validItems.length === 0) {
      throw new ValidationError(
        "No actionable tasks were found in this note.",
      );
    }

    const createdTasks: PublicTask[] = [];
    for (const item of validItems) {
      const title = (item.title as string).trim().slice(0, 200);
      const description =
        typeof item.description === "string" && item.description.trim()
          ? item.description.trim().slice(0, 5000)
          : undefined;
      const priority = normalizePriority(item.priority);
      const parsedDueDate =
        typeof item.dueDate === "string" && !Number.isNaN(Date.parse(item.dueDate))
          ? new Date(item.dueDate)
          : undefined;
      const estimatedMinutes =
        typeof item.estimatedMinutes === "number" &&
        Number.isFinite(item.estimatedMinutes) &&
        item.estimatedMinutes >= 1
          ? Math.round(item.estimatedMinutes)
          : undefined;
      const tags = Array.isArray(item.tags)
        ? item.tags
            .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
            .map((tag) => tag.trim().slice(0, 50))
            .slice(0, 10)
        : [];

      const created = await taskService.create(user, {
        title,
        description,
        status: TaskStatus.TODO,
        priority,
        dueDate: parsedDueDate,
        estimatedMinutes,
        tags,
      });
      createdTasks.push(created);
    }

    const existingIds = new Set(note.linkedTaskIds.map((id) => id.toString()));
    for (const created of createdTasks) {
      if (!existingIds.has(created.id)) {
        note.linkedTaskIds.push(new Types.ObjectId(created.id));
      }
    }
    if (overrideContent !== undefined && overrideContent !== note.content) {
      note.content = overrideContent;
    }
    await note.save();

    return {
      tasks: createdTasks,
      note: toPublicNote(note),
    };
  }
}

export const noteService = new NoteService();
