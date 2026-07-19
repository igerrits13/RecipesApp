import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "BACKFILL",
        "SET_COLLECTION_DATES",
        "UPDATE_BANNED_WORD",
        "UPDATE_MEASUREMENT",
        "UPDATE_INGREDIENT_INDEX",
        "DELETE_REPORT",
        "DELETE_USER",
        "DELETE_RECIPE",
        "DELETE_COMMENT",
        "DELETE_BANNED_WORD",
        "DELETE_COLLECTION_ITEMS",
      ],
    },
    notes: {
      type: String,
      minlength: 1,
      maxlength: 500,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true },
);

const Log = mongoose.models.Log || mongoose.model("Log", logSchema);

export default Log;
