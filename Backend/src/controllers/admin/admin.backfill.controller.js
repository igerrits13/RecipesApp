import BannedWord from "../../models/BannedWord.model.js";
import Comment from "../../models/comment.model.js";
import CommentVote from "../../models/commentVote.model.js";
import Event from "../../models/report.model.js";
import Holiday from "../../models/holiday.model.js";
import Ingredient from "../../models/ingredient.model.js";
import Log from "../../models/log.model.js";
import Measurement from "../../models/measurement.model.js";
import Note from "../../models/note.model.js";
import Rating from "../../models/rating.model.js";
import Recipe from "../../models/recipe.model.js";
import Season from "../../models/season.model.js";
import Tag from "../../models/tag.model.js";
import User from "../../models/user.model.js";

import { backfillCollectionData } from "../../services/admin/admin.backfill.services.js";

const modelMapping = {
  bannedWords: BannedWord,
  comments: Comment,
  commentVotes: CommentVote,
  events: Event,
  holidays: Holiday,
  ingredients: Ingredient,
  logs: Log,
  measurements: Measurement,
  notes: Note,
  ratings: Rating,
  recipes: Recipe,
  seasons: Season,
  tags: Tag,
  users: User,
};

// Create a route for backfilling new data to a specified collection
export async function backfillCollection(req, res) {
  try {
    // Get the input values from the request
    const { collection } = req.params;
    const collectionModel = modelMapping[collection];
    const { newFieldName, defaultValue } = req.body;

    // Add the new field to the specified collection with the default value
    await backfillCollectionData({
      collectionModel,
      newFieldName,
      defaultValue,
    });

    res
      .status(200)
      .json({ success: true, message: "Backfill completed successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
