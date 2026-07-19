import {
  getAllDeletedComments,
  getAllReportedComments,
  deleteCommentById,
} from "../../services/admin/admin.comment.services.js";
import { getPagination } from "../../utils/getPagination.js";

// Create a route for getting all soft deleted comments
export async function getDeletedComments(req, res) {
  try {
    // Get query information for comments to send
    const { page, limit, offset } = getPagination(req.query);

    const comments = await getAllDeletedComments(page, limit, offset);

    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for getting all reported comments
export async function getReportedComments(req, res) {
  try {
    // Get query information for comments to send
    const { page, limit, offset } = getPagination(req.query);

    const comments = await getAllReportedComments(page, limit, offset);

    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for deleting a comment permanently by ID
export async function deleteCommentPermanently(req, res) {
  try {
    const { id } = req.params;
    await deleteCommentById(id);

    res.status(200).json({
      success: true,
      message: "Comment deleted permanently",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
