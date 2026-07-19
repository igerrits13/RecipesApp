import Comment from "../models/comment.model.js";
import Recipe from "../models/recipe.model.js";
import User from "../models/user.model.js";
import { submitReport } from "../services/report.services.js";

import { generateReport } from "../utils/generateEvent.js";

// Create a route for reporting a comment by its ID
export async function reportCommentById(req, res) {
  try {
    const id = req.params.commentId;
    const { description } = req.body;

    await submitReport({
      id,
      reportingUserId: req.user._id,
      reportType: "report_comment",
      description: description || null,
      collectionName: Comment,
    });

    res
      .status(200)
      .json({ success: true, message: "Comment reported successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for reporting a recipe by its ID
export async function reportRecipeById(req, res) {
  try {
    const id = req.params.recipeId;
    const { description } = req.body;

    await submitReport({
      id,
      reportingUserId: req.user._id,
      reportType: "report_recipe",
      description: description || null,
      collectionName: Recipe,
    });

    res.status(200).json({
      success: true,
      message: "Recipe reported successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for reporting a user by their ID
export async function reportUserById(req, res) {
  try {
    const id = req.params.userId;
    const { description } = req.body;

    await submitReport({
      id,
      reportingUserId: req.user._id,
      reportType: "report_user",
      description: description || null,
      collectionName: User,
    });

    res.status(200).json({
      success: true,
      message: "User reported successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for reporting a bug with the application
export async function reportBug(req, res) {
  try {
    const { description } = req.body;

    await submitReport({
      reportingUserId: req.user._id,
      reportType: "report_bug",
      targetId: null,
      description: req.body.description || null,
      collectionName: null,
    });

    res.status(200).json({
      success: true,
      message: "Bug reported successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for submitting general feedback about the application
export async function submitFeedback(req, res) {
  try {
    const { description } = req.body;

    await submitReport({
      reportingUserId: req.user._id,
      reportType: "feedback",
      targetId: null,
      description: req.body.description || null,
      collectionName: null,
    });

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

// Create a route for submitting a general report that does not fit into any of the other categories
export async function submitGeneralReport(req, res) {
  try {
    const { description } = req.body;

    await submitReport({
      reportingUserId: req.user._id,
      reportType: "other",
      targetId: null,
      description: req.body.description || null,
      collectionName: null,
    });

    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
