import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportingUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportType: {
      type: String,
      enum: [
        "report_banned_word",
        "report_comment",
        "report_recipe",
        "report_user",
        "report_bug",
        "feedback",
        "other",
      ],
      required: true,
      default: "other",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed", "needs_more_info"],
      default: "pending",
      required: true,
    },
    collectionName: {
      type: String,
      trim: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "collectionName",
    },
    description: { type: String, trim: true, maxlength: 500 },
    resolutionNotes: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 500,
      required: true,
      default: "Pending resolution",
    },
  },
  { timestamps: true },
);

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
