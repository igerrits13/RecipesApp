import Comment from "../../models/comment.model.js";

// Get all comments that have been soft deleted with pagination
export async function getAllDeletedComments(page, limit, offset) {
  const totalComments = await Comment.countDocuments({ isDeleted: true });

  // Get the soft deleted comments with pagination, showing the oldest deleted comments first
  const deletedComments = await Comment.find({ isDeleted: true })
    .select("+reportCount")
    .populate("authorId", "displayName profileImage")
    .populate("recipeId", "title slug")
    .sort({ createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    deletedComments,
    currentPage: page,
    totalComments,
    totalPages: Math.ceil(totalComments / limit),
  };
}

// Get all comments that have been reported with pagination
export async function getAllReportedComments(page, limit, offset) {
  const totalComments = await Comment.countDocuments({
    reportCount: { $gt: 0 },
  });

  // Get the reported comments with pagination, showing the most reported comments first and then the oldest comments first
  const reportedComments = await Comment.find({ reportCount: { $gt: 0 } })
    .select("+reportCount")
    .populate("authorId", "displayName profileImage")
    .populate("recipeId", "title slug")
    .sort({ reportCount: -1, createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    reportedComments,
    currentPage: page,
    totalComments,
    totalPages: Math.ceil(totalComments / limit),
  };
}

// Permanently delete the comment from the database
export async function deleteCommentById(commentId) {
  const deletedComment = await Comment.findByIdAndDelete(commentId);

  // Throw an error if the comment was not found
  if (!deletedComment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }
}
