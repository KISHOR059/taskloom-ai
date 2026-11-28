import mongoose, { model, Schema, type HydratedDocument, type Types } from "mongoose";

export interface Note {
  userId: Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  noteDate?: Date;
  linkedTaskIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type NoteDocument = HydratedDocument<Note>;

const noteSchema = new Schema<Note>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "Untitled Note",
    },
    content: {
      type: String,
      default: "",
      maxlength: 50_000,
    },
    tags: {
      type: [String],
      default: [],
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    noteDate: {
      type: Date,
      required: false,
    },
    linkedTaskIds: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

noteSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

export const NoteModel =
  (mongoose.models.Note as mongoose.Model<Note> | undefined) ??
  model<Note>("Note", noteSchema);
