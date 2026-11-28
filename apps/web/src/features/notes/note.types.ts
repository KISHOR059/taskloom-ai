import type { Task } from "@/features/tasks/task.types";

export interface Note {
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

export interface NoteListParams {
  search?: string;
  tag?: string;
  pinned?: boolean;
}

export interface CreateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  noteDate?: string | null;
  linkedTaskIds?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  noteDate?: string | null;
  linkedTaskIds?: string[];
}

export interface ExtractTasksResponse {
  tasks: Task[];
  note: Note;
}
