import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    originalContent: { type: String, default: null },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    aggregateVote: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0, select: false },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true },
);

commentSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
commentSchema.index({ recipeId: 1, isDeleted: 1, createdAt: -1 });

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
