import mongoose from "mongoose";

import BannedWord from "../../models/BannedWord.model.js";
import Report from "../../models/report.model.js";
import Holiday from "../../models/holiday.model.js";
import Season from "../../models/season.model.js";
import Ingredient from "../../models/ingredient.model.js";
import Measurement from "../../models/measurement.model.js";
import Logs from "../../models/log.model.js";

import { generateLog } from "../../utils/generateEvent.js";

// Define constants for validation
const bannedWordSeverityLevels = ["flag", "block"];
const allowedCollectionDatesTypes = ["fixed", "rule-based"];
const validMeasurementUnits = [
  // Volume units (us customary)
  "teaspoon",
  "tablespoon",
  "fluid ounce",
  "cup",
  "pint",
  "quart",
  "gallon",
  // Dry weight units (us customary)
  "ounce",
  "pound",
  // Volume and mass units (metric)
  "milliliter",
  "liter",
  "gram",
  "kilogram",
  // Common non-standard units
  "a pinch",
  "a dash",
  "a handful",
  "shot",
  "clove",
  "slice",
  "piece",
  "can",
  "stick",
  "bunch",
  "sprig",
  "to taste",
];
const validMeasurementSystems = ["us customary", "metric", "non-standard"];
const validMeasurementBaseUnits = ["volume", "weight"];

// Helper function to get the dates for any rule based collection (holiday or season)
async function getDatesForRuleBasedCollection(
  year,
  month,
  weekday,
  week,
  duration,
) {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const firstWeekdayOfMonth = firstDayOfMonth.getDay();

  const offset = (weekday - firstWeekdayOfMonth + 7) % 7;
  const firstOccurrence = 1 + offset + (week - 1) * 7;

  return {
    startDate: new Date(year, month - 1, firstOccurrence),
    endDate: new Date(year, month - 1, firstOccurrence + duration - 1),
  };
}

// Helper function to compare the current date to the given date to determine if the given date has already passed
function doesRuleBasedCollectionNeedDateUpdate(currentDate, otherDate) {
  return currentDate > otherDate;
}

// Get all banned words with pagination
export async function getAllBannedWords(page, limit, offset) {
  const totalBannedWords = await BannedWord.countDocuments();

  const bannedWords = await BannedWord.find()
    .select(" authorId word severity")
    .populate("authorId", "username profileImage")
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    bannedWords,
    currentPage: page,
    totalBannedWords,
    totalPages: Math.ceil(totalBannedWords / limit),
  };
}

// Add new banned words to the database, ignoring duplicates
export async function addNewBannedWords(newBannedWords, authorId) {
  // Ensure newBannedWords is an array of strings and not empty
  if (!Array.isArray(newBannedWords) || newBannedWords.length === 0) {
    const error = new Error(
      "New banned words must be a non-empty array of words",
    );
    error.statusCode = 400;
    throw error;
  }

  // Validate each word in the array
  for (const wordObject of newBannedWords) {
    if (
      typeof wordObject.word !== "string" ||
      wordObject.word.trim().length === 0 ||
      wordObject.word.length > 50
    ) {
      const error = new Error(
        "Each banned word must be a non-empty string with a maximum length of 50 characters",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Insert any new banned words, ignoring duplicates
  let bannedWords;
  try {
    bannedWords = await BannedWord.insertMany(
      newBannedWords.map((wordObject) => ({
        word: wordObject.word.toLowerCase().trim(),
        severity:
          wordObject.severity &&
          bannedWordSeverityLevels.includes(wordObject.severity)
            ? wordObject.severity
            : "block",
        authorId,
      })),
      { ordered: false },
    );
  } catch (error) {
    // Ignore duplicate key errors
    if (error.code === 11000) {
      bannedWords = error.insertedDocs || [];
    } else {
      throw error;
    }
  }

  return bannedWords;
}

// Update a banned word by id
export async function updateBannedWord({
  id,
  word,
  severity,
  reportId,
  authorId,
}) {
  // Ensure the banned word exists
  const existingBannedWord = await BannedWord.findById(id);
  if (!existingBannedWord) {
    const error = new Error("Banned word not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate the new word if provided
  if (word) {
    if (
      typeof word !== "string" ||
      word.trim().length === 0 ||
      word.length > 50
    ) {
      const error = new Error(
        "The banned word must be a non-empty string with a maximum length of 50 characters",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate the new severity if provided
  if (severity) {
    if (!bannedWordSeverityLevels.includes(severity)) {
      const error = new Error(
        "The banned word severity must be either 'flag' or 'block'",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate reportId if provided and ensure it exists
  if (reportId) {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      const error = new Error("Invalid reportId format");
      error.statusCode = 400;
      throw error;
    }
    const reportExists = await Report.findById(reportId);
    if (!reportExists) {
      const error = new Error("Report with the provided reportId not found");
      error.statusCode = 404;
      throw error;
    }
  }

  const updatedBannedWord = await BannedWord.findByIdAndUpdate(
    id,
    {
      word: word ? word.toLowerCase().trim() : existingBannedWord.word,
      severity: severity ? severity : existingBannedWord.severity,
      authorId: authorId,
    },
    { new: true, runValidators: true },
  );

  // Generate a log of the event
  await generateLog({
    adminId: authorId,
    action: "UPDATE_BANNED_WORD",
    targetId: existingBannedWord._id,
    notes: `Updated banned word from "${existingBannedWord.word}" with severity "${existingBannedWord.severity}"
       to "${updatedBannedWord.word}" with severity "${updatedBannedWord.severity}"`,
    reportId: reportId || null,
  });

  return updatedBannedWord;
}

// Delete a banned word by id
export async function deleteBannedWord({ id, reportId, authorId }) {
  // Validate reportId if provided
  if (reportId) {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      const error = new Error("Invalid reportId format");
      error.statusCode = 400;
      throw error;
    }
  }

  // Ensure the banned word exists
  const existingBannedWord = await BannedWord.findById(id);
  if (!existingBannedWord) {
    const error = new Error("Banned word not found");
    error.statusCode = 404;
    throw error;
  }

  // Generate a log of the event
  await generateLog({
    adminId: authorId,
    action: "DELETE_BANNED_WORD",
    targetId: existingBannedWord._id,
    notes: `Deleted banned word "${existingBannedWord.word}" with severity "${existingBannedWord.severity}"`,
    reportId: reportId || null,
  });

  await BannedWord.findByIdAndDelete(id);
}

// Set the dates for the specified collection
export async function setCollectionDates({
  id,
  type,
  startDate,
  endDate,
  month,
  weekday,
  week,
  year = new Date().getFullYear(),
  duration,
  collection,
  authorId,
  ignoreLog = false,
}) {
  // Ensure the document exists
  const existingDocument = await collection.findById(id);
  if (!existingDocument) {
    const error = new Error(
      `${collection.modelName} with the provided id not found`,
    );
    error.statusCode = 404;
    throw error;
  }

  if (!allowedCollectionDatesTypes.includes(type)) {
    const error = new Error(
      "Invalid type. Type must be either 'fixed' or 'rule-based'",
    );
    error.statusCode = 400;
    throw error;
  }

  if (type === "fixed") {
    if (
      !startDate ||
      typeof startDate !== "string" ||
      !endDate ||
      typeof endDate !== "string"
    ) {
      const error = new Error(
        "For fixed type, both startDate and endDate are required and must be strings",
      );
      error.statusCode = 400;
      throw error;
    }
    existingDocument.type = "fixed";
    existingDocument.startDate = startDate;
    existingDocument.endDate = endDate;
    // Clear rule-based fields if switching from rule-based to fixed
    existingDocument.month = undefined;
    existingDocument.weekday = undefined;
    existingDocument.week = undefined;
    existingDocument.duration = undefined;
  } else {
    if (
      month === undefined ||
      typeof month !== "number" ||
      weekday === undefined ||
      typeof weekday !== "number" ||
      week === undefined ||
      typeof week !== "number" ||
      duration === undefined ||
      typeof duration !== "number"
    ) {
      const error = new Error(
        "For rule-based type, month, weekday, week, and duration are required and must be numbers",
      );
      error.statusCode = 400;
      throw error;
    }
    existingDocument.type = "rule-based";
    existingDocument.month = month;
    existingDocument.weekday = weekday;
    existingDocument.week = week;
    existingDocument.duration = duration;
    const { startDate, endDate } = await getDatesForRuleBasedCollection(
      year,
      month,
      weekday,
      week,
      duration,
    );
    existingDocument.startDate = startDate;
    existingDocument.endDate = endDate;
  }

  await existingDocument.save();

  // Generate a log of the event if not ignored
  if (!ignoreLog) {
    await generateLog({
      adminId: authorId,
      action: "SET_COLLECTION_DATES",
      targetId: existingDocument._id,
      notes:
        type === "fixed"
          ? `Set fixed dates for ${collection.modelName} "${existingDocument.title}" to startDate: ${existingDocument.startDate}, endDate: ${existingDocument.endDate}`
          : `Set rule-based dates for ${collection.modelName} "${existingDocument.title}" with month: ${month}, weekday: ${weekday}, week: ${week},
         duration: ${duration} resulting in startDate: ${existingDocument.startDate}, endDate: ${existingDocument.endDate}`,
    });
  }

  return existingDocument;
}

// Automatically update the dates for the specified collection based on the current year if it is a rule-based collection
export async function updateRuleBasedCollectionDates({
  id,
  collection,
  authorId,
  ignoreLog = false,
}) {
  const document = await collection.findById(id);
  if (!document || document.type !== "rule-based") {
    const error = new Error("Rule-based document not found");
    error.statusCode = 404;
    throw error;
  }

  // If the rule has already been updated for the current year, do not update it again
  if (!doesRuleBasedCollectionNeedDateUpdate(new Date(), document.endDate)) {
    return null;
  }

  const updatedDocument = await setCollectionDates({
    id,
    type: document.type,
    month: document.month,
    weekday: document.weekday,
    week: document.week,
    duration: document.duration,
    year: document.startDate.getFullYear() + 1, // Update to the next year if the current year's date has already passed
    collection,
    authorId,
    ignoreLog,
  });

  return updatedDocument;
}

// Update the dates for all rule-based collections
export async function updateAllRuleBasedCollectionDates(authorId) {
  // Get all rule-based holidays and seasons that need to be updated
  const holidaysToUpdate = await Holiday.find({ type: "rule-based" });
  const seasonsToUpdate = await Season.find({ type: "rule-based" });

  // Update all of them and collect the updated documents
  const updatedHolidays = [];
  for (const holiday of holidaysToUpdate) {
    const updatedHoliday = await updateRuleBasedCollectionDates({
      id: holiday._id,
      collection: Holiday,
      authorId,
      ignoreLog: true, // Logs will be generated in bulk after all updates are done
    });
    if (updatedHoliday) updatedHolidays.push(updatedHoliday);
  }

  const updatedSeasons = [];
  for (const season of seasonsToUpdate) {
    const updatedSeason = await updateRuleBasedCollectionDates({
      id: season._id,
      collection: Season,
      authorId,
      ignoreLog: true, // Logs will be generated in bulk after all updates are done
    });
    if (updatedSeason) updatedSeasons.push(updatedSeason);
  }

  // If no collections needed to be updated, return null for both to indicate that no updates were necessary
  if (updatedHolidays.length === 0 && updatedSeasons.length === 0) {
    return { updatedHolidays: null, updatedSeasons: null };
  }

  // Generate a log of the event
  await generateLog({
    adminId: authorId,
    action: "SET_COLLECTION_DATES",
    notes: `Updated rule-based collection dates for holidays: ${updatedHolidays
      .map((h) => h.title)
      .join(", ")} and seasons: ${updatedSeasons
      .map((s) => s.title)
      .join(", ")}`,
  });

  return { updatedHolidays, updatedSeasons };
}

// Get all seasons and holidays that do not have dates set yet
export async function getUndatedCollections() {
  const undatedHolidays = await Holiday.find({
    $or: [{ startDate: { $exists: false } }, { endDate: { $exists: false } }],
  });
  const undatedSeasons = await Season.find({
    $or: [{ startDate: { $exists: false } }, { endDate: { $exists: false } }],
  });

  return { undatedHolidays, undatedSeasons };
}

// Update the indexItem field for a given ingredient
export async function updateIngredientIndex(id, authorId) {
  const ingredient = await Ingredient.findById(id);

  if (!ingredient) {
    const error = new Error("Ingredient not found");
    error.statusCode = 404;
    throw error;
  }

  ingredient.indexItem = !ingredient.indexItem;
  await ingredient.save();

  // Generate a log of the event
  await generateLog({
    adminId: authorId,
    action: "UPDATE_INGREDIENT_INDEX",
    targetId: id,
    notes: `Updated indexItem for ${ingredient.title} to ${ingredient.indexItem}`,
  });

  return ingredient;
}

// Delete an array of collection items from the specified collection based on their titles
export async function deleteCollectionItemsByTitles({
  titles,
  collection,
  authorId,
}) {
  if (!Array.isArray(titles) || titles.length === 0) {
    const error = new Error(
      `${collection.modelName} titles must be a non-empty array of strings`,
    );
    error.statusCode = 400;
    throw error;
  }

  for (const title of titles) {
    if (typeof title !== "string" || title.trim().length === 0) {
      const error = new Error(
        `${collection.modelName} titles must be a non-empty array of strings`,
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Normalize all titles for deletion
  const normalizedTitles = titles.map((title) => title.toLowerCase().trim());

  await collection.deleteMany({ title: { $in: normalizedTitles } });

  // Generate a log of the event
  await generateLog({
    adminId: authorId,
    action: "DELETE_COLLECTION_ITEMS",
    notes: `Deleted documents from ${collection.modelName} collection with titles: ${normalizedTitles.join(
      ", ",
    )}`,
  });

  return;
}

// Add a new measurement to the database
export async function addNewMeasurement({
  title,
  system,
  baseUnit,
  toBaseFactor,
  authorId,
}) {
  // Ensure all required fields are provided and valid
  if (!title || !system || !baseUnit || toBaseFactor === undefined) {
    const error = new Error("Missing required fields");
    error.statusCode = 400;
    throw error;
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    const error = new Error("Title must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }
  if (
    typeof system !== "string" ||
    !validMeasurementSystems.includes(system.trim().toLowerCase())
  ) {
    const error = new Error("Invalid measurement system");
    error.statusCode = 400;
    throw error;
  }
  if (
    typeof baseUnit !== "string" ||
    !validMeasurementBaseUnits.includes(baseUnit.trim().toLowerCase())
  ) {
    const error = new Error("Invalid measurement base unit");
    error.statusCode = 400;
    throw error;
  }
  if (typeof toBaseFactor !== "number" || toBaseFactor < 0) {
    const error = new Error("Invalid toBaseFactor value");
    error.statusCode = 400;
    throw error;
  }

  // Ensure the title is one of the valid measurement units
  if (!validMeasurementUnits.includes(title.trim().toLowerCase())) {
    const error = new Error("Invalid measurement unit title");
    error.statusCode = 400;
    throw error;
  }

  // Ensure the measurement does not already exist
  const existingMeasurement = await Measurement.findOne({ title });
  if (existingMeasurement) {
    const error = new Error("Measurement unit with this title already exists");
    error.statusCode = 409;
    throw error;
  }

  // Create the new measurement
  const newMeasurement = await Measurement.create({
    title: title.trim().toLowerCase(),
    system: system.trim().toLowerCase(),
    baseUnit: baseUnit.trim().toLowerCase(),
    toBaseFactor,
  });

  return newMeasurement;
}

// Update an existing measurement by id
export async function updateMeasurementUnit({
  id,
  system,
  baseUnit,
  toBaseFactor,
  authorId,
}) {
  // Ensure the measuement exists
  const existingMeasurement = await Measurement.findById(id);
  if (!existingMeasurement) {
    const error = new Error("Measurement unit not found");
    error.statusCode = 404;
    throw error;
  }

  // Ensure all required fields are provided and valid
  if (!validMeasurementSystems.includes(system)) {
    const error = new Error("Invalid measurement system");
    error.statusCode = 400;
    throw error;
  }
  if (!validMeasurementBaseUnits.includes(baseUnit)) {
    const error = new Error("Invalid measurement base unit");
    error.statusCode = 400;
    throw error;
  }
  if (typeof toBaseFactor !== "number" || toBaseFactor < 0) {
    const error = new Error("Invalid toBaseFactor value");
    error.statusCode = 400;
    throw error;
  }

  const updatedMeasurement = await Measurement.findByIdAndUpdate(
    id,
    { system, baseUnit, toBaseFactor },
    { new: true },
  );

  // Generate a log of the event
  await generateLog({
    adminId: authorId,
    action: "UPDATE_MEASUREMENT",
    targetId: existingMeasurement._id,
    notes: `Updated measurement unit "${existingMeasurement.title}" with system "${existingMeasurement.system}", base unit "${existingMeasurement.baseUnit}", and toBaseFactor ${existingMeasurement.toBaseFactor}
     to system "${updatedMeasurement.system}", base unit "${updatedMeasurement.baseUnit}", and toBaseFactor ${updatedMeasurement.toBaseFactor}`,
  });

  return updatedMeasurement;
}

// Get all reports and populate them accordingly
export async function getAllReports() {
  // Get all reports
  const reports = await Report.find()
    .populate("reportingUserId", "displayName")
    .populate("adminId", "displayName")
    .populate("targetId")
    .sort({ createdAt: 1 });

  return reports;
}

// Update an existing reports information
export async function updateReport({
  id,
  status,
  collectionName,
  targetId,
  resolutionNotes,
  adminId,
}) {
  // Update the report
  const updatedReport = await Report.findByIdAndUpdate(
    id,
    {
      status: status.toLowerCase() || "pending",
      collectionName: collectionName || null,
      targetId: targetId || null,
      resolutionNotes: resolutionNotes || "Pending resolution",
      adminId,
    },
    { new: true },
  );

  if (!updatedReport) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }

  return updatedReport;
}
