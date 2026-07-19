import {
  getAllBannedWords,
  addNewBannedWords,
  updateBannedWord,
  deleteBannedWord,
  setCollectionDates,
  updateRuleBasedCollectionDates,
  updateAllRuleBasedCollectionDates,
  getUndatedCollections,
  deleteCollectionItemsByTitles,
  addNewMeasurement,
  updateMeasurementUnit,
  getAllReports,
  updateReport,
  updateIngredientIndex,
} from "../../services/admin/admin.metadata.services.js";
import { getPagination } from "../../utils/getPagination.js";

import Holiday from "../../models/holiday.model.js";
import Season from "../../models/season.model.js";
import Tag from "../../models/tag.model.js";
import Meal from "../../models/meal.model.js";
import Cuisine from "../../models/cuisine.model.js";
import Ingredient from "../../models/ingredient.model.js";
import Log from "../../models/log.model.js";
import Report from "../../models/report.model.js";

// Create a route for getting all banned words
export async function getBannedWords(req, res) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const bannedWords = await getAllBannedWords(page, limit, offset);

    res
      .status(200)
      .json({ bannedWords, message: "Retrieved all banned words" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for adding new banned words
export async function addBannedWords(req, res) {
  try {
    const { newBannedWords } = req.body;

    const bannedWords = await addNewBannedWords(newBannedWords, req.user._id);

    res.status(201).json({ bannedWords, message: "Added new banned words" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating a banned word by id
export async function updateBannedWordById(req, res) {
  try {
    const { id } = req.params;
    const { word, severity, reportId } = req.body;

    const updatedBannedWord = await updateBannedWord({
      id,
      word,
      severity,
      reportId,
      authorId: req.user._id,
    });

    res.status(200).json({ updatedBannedWord, message: "Updated banned word" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting a banned word by id
export async function deleteBannedWordById(req, res) {
  try {
    const { id } = req.params;
    const { reportId } = req.body;

    await deleteBannedWord({
      id,
      reportId: reportId || null,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted banned word" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for setting dates for a holiday
export async function setHolidayDatesById(req, res) {
  try {
    const { id } = req.params;
    const { type, startDate, endDate, month, weekday, week, duration } =
      req.body;

    const updatedHoliday = await setCollectionDates({
      id,
      type,
      startDate,
      endDate,
      month,
      weekday,
      week,
      duration,
      collection: Holiday,
      authorId: req.user._id,
    });

    res.status(200).json({ updatedHoliday, message: "Set holiday dates" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for setting dates for a season
export async function setSeasonDatesById(req, res) {
  try {
    const { id } = req.params;
    const { type, startDate, endDate, month, weekday, week, duration } =
      req.body;

    const updatedSeason = await setCollectionDates({
      id,
      type,
      startDate,
      endDate,
      month,
      weekday,
      week,
      duration,
      collection: Season,
      authorId: req.user._id,
    });

    res.status(200).json({ updatedSeason, message: "Set season dates" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating a rule-based holiday to have new dates when entering a new year
export async function updateRuleBasedHolidayDatesById(req, res) {
  try {
    const { id } = req.params;

    const updatedHoliday = await updateRuleBasedCollectionDates({
      id,
      collection: Holiday,
      authorId: req.user._id,
    });

    res.status(200).json({
      updatedHoliday,
      message: "Updated rule-based holiday dates",
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating a rule-based season to have new dates when entering a new year
export async function updateRuleBasedSeasonDatesById(req, res) {
  try {
    const { id } = req.params;

    const updatedSeason = await updateRuleBasedCollectionDates({
      id,
      collection: Season,
      authorId: req.user._id,
    });

    res.status(200).json({
      updatedSeason,
      message: "Updated rule-based season dates",
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating all rule-based collections to have new dates when entering a new year
export async function updateAllRuleBasedSeasonAndHolidayDates(req, res) {
  try {
    const { updatedHolidays, updatedSeasons } =
      await updateAllRuleBasedCollectionDates(req.user._id);

    res.status(200).json({
      updatedHolidays,
      updatedSeasons,
      message: "Updated rule-based collection dates",
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for getting all seasons and holidays that do not have dates set yet
export async function getUndatedSeasonsAndHolidays(req, res) {
  try {
    const { undatedHolidays, undatedSeasons } = await getUndatedCollections();

    res.status(200).json({
      undatedHolidays,
      undatedSeasons,
      message: "Retrieved undated collections",
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting an array of meals by their titles
export async function deleteMealsByTitles(req, res) {
  try {
    const { mealTitles } = req.body;

    await deleteCollectionItemsByTitles({
      titles: mealTitles,
      collection: Meal,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted meals" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting an array of cuisines by their titles
export async function deleteCuisinesByTitles(req, res) {
  try {
    const { cuisineTitles } = req.body;

    await deleteCollectionItemsByTitles({
      titles: cuisineTitles,
      collection: Cuisine,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted cuisines" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting an array of holidays by their titles
export async function deleteHolidaysByTitles(req, res) {
  try {
    const { holidayTitles } = req.body;

    await deleteCollectionItemsByTitles({
      titles: holidayTitles,
      collection: Holiday,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted holidays" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting an array of seasons by their titles
export async function deleteSeasonsByTitles(req, res) {
  try {
    const { seasonTitles } = req.body;

    await deleteCollectionItemsByTitles({
      titles: seasonTitles,
      collection: Season,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted seasons" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting an array of tags by their titles
export async function deleteTagsByTitles(req, res) {
  try {
    const { tagTitles } = req.body;

    await deleteCollectionItemsByTitles({
      titles: tagTitles,
      collection: Tag,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted tags" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for getting all ingredients and their index status
export async function getIngredients(req, res) {
  try {
    const ingredients = await Ingredient.find().sort({ indexItem: 1 });

    res.status(200).json({ ingredients, message: "Retrieved ingredients" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating if a ingredient should be indexed or not by its id
export async function updateIngredientIndexById(req, res) {
  try {
    const { id } = req.params;

    const ingredient = await updateIngredientIndex(id, req.user._id);

    res.status(200).json({ ingredient, message: "Updated ingredient index" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting an array of ingredients by their titles
export async function deleteIngredientsByTitles(req, res) {
  try {
    const { ingredientTitles } = req.body;

    await deleteCollectionItemsByTitles({
      titles: ingredientTitles,
      collection: Ingredient,
      authorId: req.user._id,
    });

    res.status(200).json({ message: "Deleted ingredients" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for creating a new measurement
export async function createMeasurementUnit(req, res) {
  try {
    const { title, system, baseUnit, toBaseFactor } = req.body;

    const newMeasurement = await addNewMeasurement({
      title,
      system,
      baseUnit,
      toBaseFactor,
      authorId: req.user._id,
    });

    res
      .status(201)
      .json({ newMeasurement, message: "Created measurement unit" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating an existing measurement
export async function updateMeasurementUnitById(req, res) {
  try {
    const { id } = req.params;
    const { system, baseUnit, toBaseFactor } = req.body;

    const updatedMeasurement = await updateMeasurementUnit({
      id,
      system,
      baseUnit,
      toBaseFactor,
      authorId: req.user._id,
    });

    res
      .status(200)
      .json({ updatedMeasurement, message: "Updated measurement unit" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for getting all logs
export async function getLogs(req, res) {
  try {
    const logs = await Log.find()
      .populate("adminId", "displayName")
      .sort({ createdAt: 1 });
    res.status(200).json({ logs, message: "Retrieved logs" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting a log by id
export async function deleteLogById(req, res) {
  try {
    const { id } = req.params;
    await Log.findByIdAndDelete(id);
    res.status(200).json({ message: "Deleted log" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for getting all reports
export async function getReports(req, res) {
  try {
    const reports = await getAllReports();

    res.status(200).json({ reports, message: "Retrieved reports" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for updating the status of a report
export async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, collectionName, targetId, resolutionNotes } = req.body;

    const updatedReport = await updateReport({
      id,
      status,
      collectionName,
      targetId,
      resolutionNotes,
      adminId: req.user._id,
    });

    res.status(200).json({ updatedReport, message: "Updated report status" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

// Create a route for deleting a report
export async function deleteReportById(req, res) {
  try {
    const { id } = req.params;
    await Report.findByIdAndDelete(id);
    res.status(200).json({ message: "Deleted report" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
}
