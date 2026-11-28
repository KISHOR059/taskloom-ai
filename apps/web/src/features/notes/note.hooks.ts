import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateWorkspaceTaskQueries } from "@/shared/lib/query.utils";
import { noteService } from "./note.service";
import type {
  CreateNoteInput,
  NoteListParams,
  UpdateNoteInput,
} from "./note.types";

export const noteKeys = {
  all: ["notes"] as const,
  list: (params: NoteListParams) => ["notes", "list", params] as const,
};

export function useNotes(params: NoteListParams = {}) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: ({ signal }) => noteService.list(params, signal),
    staleTime: 0,
    gcTime: 5 * 60_000,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => noteService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      noteService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => noteService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useExtractTasksFromNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content?: string }) =>
      noteService.extractTasks(id, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });
      invalidateWorkspaceTaskQueries(queryClient);
    },
  });
}
