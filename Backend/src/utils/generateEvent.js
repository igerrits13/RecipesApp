import Log from "../models/log.model.js";
import Report from "../models/report.model.js";

const validLogActions = [
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
];

const validReportActions = [
  "report_banned_word",
  "report_comment",
  "report_recipe",
  "report_user",
  "report_bug",
  "feedback",
  "other",
];

// Helper function to generate a log for admin actions such as deleting a user, recipe, etc.
export async function generateLog({
  adminId,
  action,
  targetId,
  notes,
  reportId = null,
}) {
  try {
    // Ensure the action is valid
    if (!validLogActions.includes(action)) {
      throw new Error("Invalid log action");
    }

    const log = new Log({
      adminId,
      action,
      targetId,
      notes,
      reportId,
    });

    await log.save();
  } catch (error) {
    console.error("Error generating log:", error);
  }
}

// Helper function to generate a report for user actions such as reportiung a user, recipe, etc.
export async function generateReport({
  reportingUserId = null,
  reportType,
  targetId = null,
  description,
  collectionName = null,
}) {
  try {
    // Ensure the report type is valid
    if (!validReportActions.includes(reportType)) {
      throw new Error("Invalid report type");
    }

    const report = new Report({
      reportingUserId,
      reportType,
      targetId,
      description,
      collectionName,
    });

    await report.save();
  } catch (error) {
    console.error("Error generating report:", error);
  }
}
