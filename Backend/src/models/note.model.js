import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
      index: true,
    },
    content: { type: String, required: true, minlength: 1, maxlength: 500 },
  },
  { timestamps: true },
);

// Ensure a user can only have one note per recipe
noteSchema.index({ authorId: 1, recipeId: 1 }, { unique: true });

const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);

export default Note;
