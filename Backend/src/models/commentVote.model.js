import mongoose from "mongoose";

const commentVoteSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  },
  voteType: { type: String, enum: ["upvote", "downvote"], required: true },
});

commentVoteSchema.index({ authorId: 1, commentId: 1 }, { unique: true });

const CommentVote =
  mongoose.models.CommentVote ||
  mongoose.model("CommentVote", commentVoteSchema);

export default CommentVote;
