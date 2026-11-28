import type { Request, Response } from "express";

import { UnauthorizedError, ValidationError } from "../../utils/app-error.js";
import { createdResponse, successResponse } from "../../utils/response.js";
import { noteService } from "./note.service.js";
import type {
  CreateNoteInput,
  ExtractTasksBodyInput,
  NoteListQueryInput,
  UpdateNoteInput,
} from "./note.validation.js";

function getAuthenticatedUser(request: Request) {
  if (!request.user) {
    throw new UnauthorizedError("Authenticated user is required");
  }
  return request.user;
}

function getNoteId(request: Request): string {
  const noteId = request.params.id;
  if (typeof noteId !== "string") {
    throw new ValidationError("A valid note ID is required");
  }
  return noteId;
}

export class NoteController {
  public list = async (request: Request, response: Response): Promise<void> => {
    const notes = await noteService.list(
      getAuthenticatedUser(request),
      request.query as unknown as NoteListQueryInput,
    );
    successResponse(response, { notes }, "Notes retrieved successfully");
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const note = await noteService.getById(
      getAuthenticatedUser(request),
      getNoteId(request),
    );
    successResponse(response, { note }, "Note retrieved successfully");
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const note = await noteService.create(
      getAuthenticatedUser(request),
      request.body as CreateNoteInput,
    );
    createdResponse(response, { note }, "Note created successfully");
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const note = await noteService.update(
      getAuthenticatedUser(request),
      getNoteId(request),
      request.body as UpdateNoteInput,
    );
    successResponse(response, { note }, "Note updated successfully");
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await noteService.remove(getAuthenticatedUser(request), getNoteId(request));
    successResponse(response, null, "Note deleted successfully");
  };

  public extractTasks = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const body = (request.body ?? {}) as ExtractTasksBodyInput;
    const result = await noteService.extractTasks(
      getAuthenticatedUser(request),
      getNoteId(request),
      body.content,
    );
    createdResponse(
      response,
      result,
      `Extracted ${result.tasks.length} task${result.tasks.length === 1 ? "" : "s"} from note`,
    );
  };
}

export const noteController = new NoteController();
