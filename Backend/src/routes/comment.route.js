import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUserComments,
  updateCommentById,
  undoEditCommentById,
  voteUpCommentById,
  voteDownCommentById,
  deleteCommentById,
} from "../controllers/comment.controller.js";
import { validateObjectId } from "../middleware/validation.middleware.js";
import { checkBannedWord } from "../middleware/bannedWord.middleware.js";

// Create the router using express with merged params to access recipe ID
const router = express.Router({ mergeParams: true });

// Create a route for getting all the current user's comments
router.get("/", protectRoute, getUserComments);

// Create a route for updating a specific comment by its ID
router.put(
  "/:commentId",
  protectRoute,
  checkBannedWord(["content"], false, null, "commentId", "comments"),
  validateObjectId("commentId"),
  updateCommentById,
);

// Create a route for undoing the edit of a specific comment by its ID
router.put(
  "/:commentId/undo",
  protectRoute,
  validateObjectId("commentId"),
  undoEditCommentById,
);

// Create a route for voting up a specific comment by its ID
router.post(
  "/:commentId/vote-up",
  protectRoute,
  validateObjectId("commentId"),
  voteUpCommentById,
);

// Create a route for voting down a specific comment by its ID
router.post(
  "/:commentId/vote-down",
  protectRoute,
  validateObjectId("commentId"),
  voteDownCommentById,
);

// Create a route for deleting a specific comment by its ID
router.delete(
  "/:commentId",
  protectRoute,
  validateObjectId("commentId"),
  deleteCommentById,
);

export default router;
