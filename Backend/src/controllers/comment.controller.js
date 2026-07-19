import {
  getAllUserComments,
  updateSpecificCommentById,
  undoSpecificCommentEditById,
  voteOnSpecificCommentById,
  deleteSpecificCommentById,
} from "../services/comment.services.js";
import { getPagination } from "../utils/getPagination.js";

// Create a route for getting all the current user's comments
export async function getUserComments(req, res) {
  try {
    const userId = req.user._id;

    // Get query information for comments to send
    const { page, limit, offset } = getPagination(req.query);

    const comments = await getAllUserComments(userId, page, limit, offset);

    res.status(200).json({
      comments,
      success: true,
      message: "Comments retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Create a route for updating a specific comment by its ID
export async function updateCommentById(req, res) {
  try {
    const authorId = req.user._id;
    const commentId = req.params.commentId;
    const { content } = req.body;

    const comment = await updateSpecificCommentById(
      commentId,
      authorId,
      content,
    );

    res.status(200).json({
      comment,
      success: true,
      message: "Comment updated successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for undoing the edit of a specific comment by its ID
export async function undoEditCommentById(req, res) {
  try {
    const authorId = req.user._id;
    const commentId = req.params.commentId;

    const comment = await undoSpecificCommentEditById(commentId, authorId);

    res.status(200).json({
      comment,
      success: true,
      message: "Comment edit undone successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for voting up a specific comment by its ID
export async function voteUpCommentById(req, res) {
  try {
    const authorId = req.user._id;
    const commentId = req.params.commentId;

    const comment = await voteOnSpecificCommentById(
      commentId,
      authorId,
      "upvote",
    );

    await res.status(200).json({
      comment,
      success: true,
      message: "Comment upvoted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for voting down a specific comment by its ID
export async function voteDownCommentById(req, res) {
  try {
    const authorId = req.user._id;
    const commentId = req.params.commentId;

    const comment = await voteOnSpecificCommentById(
      commentId,
      authorId,
      "downvote",
    );

    await res.status(200).json({
      comment,
      success: true,
      message: "Comment downvoted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for deleting a specific comment by its ID
export async function deleteCommentById(req, res) {
  try {
    const authorId = req.user._id;
    const commentId = req.params.commentId;

    await deleteSpecificCommentById(commentId, authorId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
