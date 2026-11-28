import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Columns2,
  Eye,
  FileText,
  PenLine,
  Pin,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";

import { AIMarkdown } from "@/features/assistant/AIMarkdown";
import {
  useCreateNote,
  useDeleteNote,
  useExtractTasksFromNote,
  useNotes,
  useUpdateNote,
} from "@/features/notes/note.hooks";
import type { Note } from "@/features/notes/note.types";
import type { Task } from "@/features/tasks/task.types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";
import { notify } from "@/shared/lib/notifications";

type EditorMode = "edit" | "split" | "preview";

const MEETING_TEMPLATE = `## Meeting Notes
**Attendees:** 
**Date:** ${new Date().toISOString().split("T")[0]}

### Agenda
- 

### Discussion & Decisions
- 

### Action Items
- [ ] 
`;

function formatDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? "";
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface NoteEditorProps {
  note: Note;
  onSaved: (updated: Note) => void;
  onDeleted: (deletedId: string) => void;
}

function NoteEditor({ note, onSaved, onDeleted }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagsInput, setTagsInput] = useState(note.tags.join(", "));
  const [noteDate, setNoteDate] = useState(formatDateInput(note.noteDate));
  const [mode, setMode] = useState<EditorMode>("split");
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);

  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const extractTasks = useExtractTasksFromNote();

  const parsedTags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const isDirty =
    title !== note.title ||
    content !== note.content ||
    noteDate !== formatDateInput(note.noteDate) ||
    parsedTags.join(",") !== note.tags.join(",");

  async function handleSave() {
    try {
      const updated = await updateNote.mutateAsync({
        id: note.id,
        input: {
          title: title.trim() || "Untitled Note",
          content,
          tags: parsedTags,
          noteDate: noteDate ? new Date(`${noteDate}T00:00:00.000Z`).toISOString() : null,
        },
      });
      onSaved(updated);
      notify.success("Note saved");
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Failed to save note",
      );
    }
  }

  async function handleTogglePin() {
    try {
      const updated = await updateNote.mutateAsync({
        id: note.id,
        input: { pinned: !note.pinned },
      });
      onSaved(updated);
      notify.success(updated.pinned ? "Note pinned" : "Note unpinned");
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Failed to update pin state",
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteNote.mutateAsync(note.id);
      onDeleted(note.id);
      notify.success("Note deleted");
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Failed to delete note",
      );
    }
  }

  async function handleExtractTasks() {
    if (!content.trim()) {
      notify.warning("Write some meeting notes or ideas before extracting tasks.");
      return;
    }

    try {
      if (isDirty) {
        await updateNote.mutateAsync({
          id: note.id,
          input: {
            title: title.trim() || "Untitled Note",
            content,
            tags: parsedTags,
            noteDate: noteDate
              ? new Date(`${noteDate}T00:00:00.000Z`).toISOString()
              : null,
          },
        });
      }

      const result = await extractTasks.mutateAsync({
        id: note.id,
        content,
      });
      setExtractedTasks(result.tasks);
      onSaved(result.note);
      notify.success(
        `Extracted ${result.tasks.length} task${result.tasks.length === 1 ? "" : "s"}`,
        "Action items have been added to your Tasks workspace.",
      );
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Failed to extract tasks",
      );
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/90 shadow-sm backdrop-blur-xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="h-9 border-transparent bg-transparent px-2 text-lg font-semibold tracking-tight focus-visible:border-border focus-visible:bg-background"
          />
          {isDirty && (
            <Badge
              variant="outline"
              className="shrink-0 border-[#F97316]/40 bg-[#F97316]/10 text-[#F97316]"
            >
              Unsaved
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
            {(
              [
                { id: "edit", label: "Edit", icon: PenLine },
                { id: "split", label: "Split", icon: Columns2 },
                { id: "preview", label: "Preview", icon: Eye },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === id
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTogglePin}
            disabled={updateNote.isPending}
            title={note.pinned ? "Unpin note" : "Pin note"}
          >
            <Pin
              className={cn(
                "h-3.5 w-3.5",
                note.pinned && "fill-[#F97316] text-[#F97316]",
              )}
            />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={updateNote.isPending || !isDirty}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateNote.isPending ? "Saving..." : "Save"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExtractTasks}
            disabled={extractTasks.isPending}
            className="border-0 bg-gradient-to-r from-[#F97316] to-[#C2410C] text-white shadow-sm hover:opacity-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {extractTasks.isPending ? "Extracting..." : "Extract Tasks"}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteNote.isPending}
            className="text-muted-foreground hover:text-destructive"
            title="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border/60 bg-muted/20 px-5 py-2.5 text-xs">
        <label className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-[#F97316]" />
          <span>Date</span>
          <input
            type="date"
            value={noteDate}
            onChange={(e) => setNoteDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-[#F97316]"
          />
        </label>

        <label className="flex min-w-[200px] flex-1 items-center gap-2 text-muted-foreground">
          <Tag className="h-3.5 w-3.5 text-[#F97316]" />
          <span>Tags</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="meeting, sprint, roadmap (comma separated)"
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none focus:border-[#F97316]"
          />
        </label>

        {note.linkedTaskIds.length > 0 && (
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-2.5 py-1 font-medium text-[#F97316] hover:bg-[#F97316]/15"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {note.linkedTaskIds.length} linked task
              {note.linkedTaskIds.length === 1 ? "" : "s"}
            </span>
          </Link>
        )}
      </div>

      {/* Editor / Preview body */}
      <div
        className={cn(
          "grid min-h-[380px] flex-1 divide-y divide-border/70 lg:divide-x lg:divide-y-0",
          mode === "split" ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {mode !== "preview" && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Capture meeting notes, brainstorm ideas, or paste raw transcripts here... Click 'Extract Tasks' to turn action items into scheduled tasks."
            className="h-full min-h-[360px] w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        )}

        {mode !== "edit" && (
          <div className="h-full min-h-[360px] overflow-y-auto bg-muted/10 p-5">
            {content.trim() ? (
              <AIMarkdown content={content} />
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Nothing to preview yet. Start typing Markdown on the left.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Newly extracted tasks banner */}
      {extractedTasks.length > 0 && (
        <div className="border-t border-border/80 bg-[#F97316]/5 px-5 py-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F97316]">
              <Sparkles className="h-3.5 w-3.5" />
              Extracted Tasks ({extractedTasks.length})
            </span>
            <Link
              to="/tasks"
              className="text-xs font-medium text-[#F97316] hover:underline"
            >
              Open in Tasks →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {extractedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-1.5 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#F97316]" />
                <span className="font-medium text-foreground">{task.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const notesQuery = useNotes(search.trim() ? { search: search.trim() } : {});
  const createNote = useCreateNote();

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const activeNote = useMemo(() => {
    if (notes.length === 0) return null;
    if (selectedId) {
      const match = notes.find((n) => n.id === selectedId);
      if (match) return match;
    }
    return notes[0] ?? null;
  }, [notes, selectedId]);

  async function handleCreateNote(template?: "meeting") {
    try {
      const created = await createNote.mutateAsync(
        template === "meeting"
          ? {
              title: `Meeting — ${new Date().toLocaleDateString()}`,
              content: MEETING_TEMPLATE,
              tags: ["meeting"],
              noteDate: new Date().toISOString(),
            }
          : {
              title: "Untitled Note",
              content: "",
            },
      );
      setSelectedId(created.id);
      notify.success("Created new note");
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Failed to create note",
      );
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/15 text-[#F97316]">
              <FileText className="h-5 w-5" />
            </span>
            Smart Notes &amp; Meeting Capture
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clean Markdown scratchpad with one-click AI task extraction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCreateNote("meeting")}
            disabled={createNote.isPending}
          >
            <CalendarDays className="h-4 w-4 text-[#F97316]" />
            <span>Meeting Template</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleCreateNote()}
            disabled={createNote.isPending}
            className="border-0 bg-gradient-to-r from-[#F97316] to-[#C2410C] text-white shadow-sm hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* 2-pane workspace */}
      <div className="grid min-h-[540px] flex-1 grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Notes sidebar */}
        <aside className="flex flex-col rounded-2xl border border-border bg-card/80 p-3.5 shadow-sm backdrop-blur-xl">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes or tags..."
              className="pl-9"
            />
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
            {notesQuery.isLoading ? (
              <div className="space-y-2 py-4 text-center text-xs text-muted-foreground">
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm font-medium text-foreground">
                  No notes yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a note or start from a meeting template.
                </p>
              </div>
            ) : (
              notes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-[#F97316]/50 bg-[#F97316]/10 shadow-xs"
                        : "border-transparent bg-transparent hover:border-border hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-semibold text-foreground">
                        {note.title || "Untitled Note"}
                      </span>
                      {note.pinned && (
                        <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-[#F97316] text-[#F97316]" />
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {note.content.trim() || "Empty note..."}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-muted-foreground">
                      <span>{formatDisplayDate(note.updatedAt)}</span>
                      <div className="flex items-center gap-1">
                        {note.linkedTaskIds.length > 0 && (
                          <span className="rounded-md bg-[#F97316]/15 px-1.5 py-0.5 font-medium text-[#F97316]">
                            {note.linkedTaskIds.length} task
                            {note.linkedTaskIds.length === 1 ? "" : "s"}
                          </span>
                        )}
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted px-1.5 py-0.5"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Active editor */}
        <section className="min-w-0">
          {activeNote ? (
            <NoteEditor
              key={activeNote.id}
              note={activeNote}
              onSaved={(updated) => setSelectedId(updated.id)}
              onDeleted={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316]/15 text-[#F97316]">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Capture notes, extract action items
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Write clean Markdown notes or paste messy meeting transcripts,
                then let AI turn action items into scheduled tasks.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCreateNote("meeting")}
                  disabled={createNote.isPending}
                >
                  <CalendarDays className="h-4 w-4 text-[#F97316]" />
                  <span>Use Meeting Template</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleCreateNote()}
                  disabled={createNote.isPending}
                  className="border-0 bg-gradient-to-r from-[#F97316] to-[#C2410C] text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Note</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
