import Comment from "../models/comment.model.js";
import CommentVote from "../models/commentVote.model.js";

// Helper function to categorize comments into top-level comments and their replies
export function categorizeComments(comments) {
  const commentMap = new Map();
  const topLevelComments = [];

  // First, create a map of comment IDs to comment objects and initialize the replies array
  for (const comment of comments) {
    commentMap.set(comment._id.toString(), {
      ...comment.toObject(),
      replies: [],
    });
  }

  // Then, iterate through the comments again to categorize them into top-level comments and replies
  for (const comment of commentMap.values()) {
    // If the comment's author is banned, skip displaying the comment entirely
    if (comment.authorId.isBanned) {
      continue;
    }

    // If the comment's author is deleted, set the display name to "Deleted User" and profile image to null
    if (comment.authorId.isDeleted) {
      comment.authorId.displayName = "Deleted User";
      comment.authorId.profileImage = null;
    }
    const { isBanned, isDeleted, ...returnAuthorData } = comment.authorId;
    comment.authorId = returnAuthorData;

    if (comment.parentCommentId) {
      // If the comment has a parentCommentId, it's a reply, so find its parent and add it to the parent's replies array
      const parentComment = commentMap.get(comment.parentCommentId.toString());
      if (parentComment) {
        parentComment.replies.push(comment);
      }
    } else {
      // If the comment has no parentCommentId, it's a top-level comment
      topLevelComments.push(comment);
    }
  }

  return topLevelComments;
}

// Helper function to return all the comment IDs
export function getAllCommentIds(comments) {
  const ids = [];
  for (const comment of comments) {
    ids.push(comment._id);
    for (const reply of comment.replies) {
      ids.push(reply._id);
    }
  }
  return ids;
}

// Helper function to delete all comment votes for a specific comment ID and its child comment IDs
export async function deleteCommentVotesByCommentId(commentId) {
  // Get comment ID and all child comment IDs to delete their votes
  const commentIdsToDelete = [commentId];
  const childComments = await Comment.find({
    parentCommentId: commentId,
    isDeleted: false,
  }).select("_id");

  commentIdsToDelete.push(...childComments.map((c) => c._id));

  await CommentVote.deleteMany({ commentId: { $in: commentIdsToDelete } });
}

// Helper function to attatch the user's vote type to each comment in the nested structure
export async function attachUserVotesToComments(categorizedComments, authorId) {
  // Get all the comment IDs to determine which comments the user has voted on
  const commentIds = getAllCommentIds(categorizedComments);

  if (commentIds.length === 0) {
    return categorizedComments;
  }

  // Get all the user's votes on the comments
  const userVotes = await CommentVote.find({
    authorId: authorId,
    commentId: { $in: commentIds },
  }).lean();

  // Create a map of comment IDs to the user's vote type for that comment
  const voteMap = new Map();

  for (const vote of userVotes) {
    voteMap.set(vote.commentId.toString(), vote.voteType);
  }

  // Add the user's vote type to each comment in the nested structure
  for (const comment of categorizedComments) {
    comment.userVote = voteMap.get(comment._id.toString()) || null;

    for (const reply of comment.replies) {
      reply.userVote = voteMap.get(reply._id.toString()) || null;
    }
  }

  return categorizedComments;
}

// Get all user comments with pagination
export async function getAllUserComments(authorId, page, limit, offset) {
  // Get the total number of comments for the user
  const totalComments = await Comment.countDocuments({
    authorId,
    isDeleted: false,
  });

  // Create the array of comments with the given query guidelines, most recent first
  const comments = await Comment.find({ authorId, isDeleted: false })
    .populate("authorId", "displayName profileImage")
    .populate({
      path: "recipeId",
      select: "title author",
      populate: { path: "author", select: "displayName profileImage" },
    })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    comments,
    currentPage: page,
    totalComments,
    totalPages: Math.ceil(totalComments / limit),
  };
}

// Update a specific comment's content by its ID, ensuring it belongs to the user
export async function updateSpecificCommentById(commentId, authorId, content) {
  // Ensure the new content is not empty and does not exceed the maximum length
  if (
    typeof content !== "string" ||
    content.trim().length < 1 ||
    content.trim().length > 500
  ) {
    const err = new Error("Comment must be between 1 and 500 characters");
    err.statusCode = 400;
    throw err;
  }

  // Ensure the comment exists and belongs to the user
  const comment = await Comment.findOne({
    _id: commentId,
    authorId,
    isDeleted: false,
  }).populate("authorId", "displayName profileImage");

  if (!comment) {
    const err = new Error("Comment not found");
    err.statusCode = 404;
    throw err;
  }

  // Update the comment's content, and store the original comment and mark it as edited only if it was not already edited before
  if (!comment.isEdited) {
    comment.originalContent = comment.content;
    comment.isEdited = true;
  }
  comment.content = content.trim();

  await comment.save();

  return comment;
}

// Revert a specific comment's content to its original content by its ID, ensuring it belongs to the user and has been edited
export async function undoSpecificCommentEditById(commentId, authorId) {
  // Ensure the comment exists and belongs to the user
  const comment = await Comment.findOne({
    _id: commentId,
    authorId,
    isDeleted: false,
  }).populate("authorId", "displayName profileImage");

  if (!comment) {
    const err = new Error("Comment not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure the comment has been edited and has original content to revert to
  if (!comment.isEdited || !comment.originalContent) {
    const err = new Error("No edit to undo for this comment");
    err.statusCode = 400;
    throw err;
  }

  // Revert the comment's content to the original content and mark it as not edited
  comment.content = comment.originalContent;
  comment.originalContent = null;
  comment.isEdited = false;

  await comment.save();

  return comment;
}

// Vote on an existing comment by its ID
export async function voteOnSpecificCommentById(commentId, authorId, voteType) {
  // Ensure the comment exists and is not deleted
  let comment = await Comment.findOne({ _id: commentId, isDeleted: false });
  if (!comment) {
    const err = new Error("Comment not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure users cannot vote on their own comments
  if (comment.authorId.toString() === authorId.toString()) {
    const err = new Error("Users cannot vote on their own comments");
    err.statusCode = 400;
    throw err;
  }

  // Check if the user has already voted on this comment
  const existingVote = await CommentVote.findOne({ authorId, commentId });

  // If the user has already voted on this comment, update the vote accordingly. Otherwise, create a new upvote
  if (existingVote) {
    // If the existing vote is the same as the new vote, remove it
    if (existingVote.voteType === voteType) {
      await CommentVote.deleteOne({ _id: existingVote._id });
      comment = await Comment.findOneAndUpdate(
        { _id: commentId },
        { $inc: { aggregateVote: voteType === "upvote" ? -1 : 1 } },
        { new: true },
      );
    }
    // If the existing vote is different from the new vote, change it to the new vote
    else {
      existingVote.voteType = voteType;
      await existingVote.save();
      comment = await Comment.findOneAndUpdate(
        { _id: commentId },
        { $inc: { aggregateVote: voteType === "upvote" ? 2 : -2 } },
        { new: true },
      );
    }
  } else {
    await CommentVote.create({ authorId, commentId, voteType });
    comment = await Comment.findOneAndUpdate(
      { _id: commentId },
      { $inc: { aggregateVote: voteType === "upvote" ? 1 : -1 } },
      { new: true },
    );
  }

  return comment;
}

// Delete a specific comment by its ID, ensuring it belongs to the user
export async function deleteSpecificCommentById(commentId, authorId) {
  // Ensure the comment exists and belongs to the user
  const comment = await Comment.findOne({
    _id: commentId,
    authorId,
    isDeleted: false,
  });

  if (!comment) {
    const err = new Error("Comment not found");
    err.statusCode = 404;
    throw err;
  }

  await deleteCommentVotesByCommentId(commentId);

  // Soft delete all child comments of the comment being deleted
  await Comment.updateMany(
    { parentCommentId: commentId, isDeleted: false },
    { isDeleted: true },
  );

  // Mark the comment as deleted
  comment.isDeleted = true;
  await comment.save();
}
