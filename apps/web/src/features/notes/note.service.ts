import axios from "axios";

import apiClient, { ApiError } from "@/shared/lib/api-client";
import type { ApiSuccess } from "@/shared/types/api";
import type {
  CreateNoteInput,
  ExtractTasksResponse,
  Note,
  NoteListParams,
  UpdateNoteInput,
} from "./note.types";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? "Request failed";
  }
  return error instanceof Error ? error.message : "Request failed";
}

async function request<T>(promise: Promise<{ data: ApiSuccess<T> }>) {
  try {
    return (await promise).data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(getErrorMessage(error), { cause: error });
  }
}

export const noteService = {
  async list(params: NoteListParams = {}, signal?: AbortSignal): Promise<Note[]> {
    const data = await request(
      apiClient.get<ApiSuccess<{ notes: Note[] }>>("/notes", {
        params: {
          ...(params.search ? { search: params.search } : {}),
          ...(params.tag ? { tag: params.tag } : {}),
          ...(params.pinned !== undefined
            ? { pinned: String(params.pinned) }
            : {}),
        },
        signal,
      }),
    );
    return data.notes;
  },

  async getById(id: string): Promise<Note> {
    const data = await request(
      apiClient.get<ApiSuccess<{ note: Note }>>(`/notes/${id}`),
    );
    return data.note;
  },

  async create(input: CreateNoteInput): Promise<Note> {
    const data = await request(
      apiClient.post<ApiSuccess<{ note: Note }>>("/notes", input),
    );
    return data.note;
  },

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    const data = await request(
      apiClient.patch<ApiSuccess<{ note: Note }>>(`/notes/${id}`, input),
    );
    return data.note;
  },

  async remove(id: string): Promise<void> {
    await request(apiClient.delete<ApiSuccess<null>>(`/notes/${id}`));
  },

  async extractTasks(
    id: string,
    content?: string,
  ): Promise<ExtractTasksResponse> {
    return request(
      apiClient.post<ApiSuccess<ExtractTasksResponse>>(
        `/notes/${id}/extract-tasks`,
        content !== undefined ? { content } : {},
      ),
    );
  },
};
