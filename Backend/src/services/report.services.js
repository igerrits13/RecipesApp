import { generateReport } from "../utils/generateEvent.js";

const validReportActions = [
  "report_banned_word",
  "report_comment",
  "report_recipe",
  "report_user",
  "report_bug",
  "feedback",
  "other",
];

export async function submitReport({
  id,
  reportingUserId,
  reportType,
  description,
  collectionName,
}) {
  let target;

  // Ifa target and collection name are poriveded, ensure the object exists within the database
  if (collectionName) {
    target = await collectionName.findById(id);

    if (!target) {
      const error = new Error(`${collectionName.modelName} not found`);
      error.statusCode = 404;
      throw error;
    }
  }

  // Ensure the report type is valid and provided
  if (!validReportActions.includes(reportType)) {
    const error = new Error("Invalid report type");
    error.statusCode = 400;
    throw error;
  }

  await generateReport({
    reportingUserId,
    reportType,
    targetId: target ? target._id : null,
    description,
    collectionName: collectionName ? collectionName.modelName : null,
  });
}
