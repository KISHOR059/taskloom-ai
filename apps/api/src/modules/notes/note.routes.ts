import { Router } from "express";
import type { Router as RouterType } from "express";

import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { noteController } from "./note.controller.js";
import {
  createNoteSchema,
  extractTasksBodySchema,
  noteListQuerySchema,
  updateNoteSchema,
} from "./note.validation.js";

const noteRouter: RouterType = Router();

noteRouter.use(requireAuth);
noteRouter.get(
  "/",
  validateQuery(noteListQuerySchema),
  asyncHandler(noteController.list),
);
noteRouter.post(
  "/",
  validateBody(createNoteSchema),
  asyncHandler(noteController.create),
);
noteRouter.get("/:id", asyncHandler(noteController.getById));
noteRouter.patch(
  "/:id",
  validateBody(updateNoteSchema),
  asyncHandler(noteController.update),
);
noteRouter.delete("/:id", asyncHandler(noteController.remove));
noteRouter.post(
  "/:id/extract-tasks",
  validateBody(extractTasksBodySchema),
  asyncHandler(noteController.extractTasks),
);

export default noteRouter;
