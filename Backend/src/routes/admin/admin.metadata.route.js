import express from "express";
import { protectRoute, requireRole } from "../../middleware/auth.middleware.js";
import { validateObjectId } from "../../middleware/validation.middleware.js";
import {
  getBannedWords,
  addBannedWords,
  updateBannedWordById,
  deleteBannedWordById,
  setHolidayDatesById,
  setSeasonDatesById,
  updateRuleBasedHolidayDatesById,
  updateRuleBasedSeasonDatesById,
  updateAllRuleBasedSeasonAndHolidayDates,
  getUndatedSeasonsAndHolidays,
  deleteMealsByTitles,
  deleteCuisinesByTitles,
  deleteHolidaysByTitles,
  deleteSeasonsByTitles,
  deleteTagsByTitles,
  getIngredients,
  updateIngredientIndexById,
  deleteIngredientsByTitles,
  createMeasurementUnit,
  updateMeasurementUnitById,
  getLogs,
  deleteLogById,
  getReports,
  updateReportStatus,
  deleteReportById,
} from "../../controllers/admin/admin.metadata.controller.js";

// Create a router using express
const router = express.Router();

// Create a route for getting all banned words
router.get(
  "/banned-words",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getBannedWords,
);

// Create a route for adding new banned words
router.post(
  "/banned-words",
  protectRoute,
  requireRole(["moderator", "admin"]),
  addBannedWords,
);

// Create a route for updating a banned word by id
router.patch(
  "/banned-words/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  updateBannedWordById,
);

// Create a route for deleting a banned word by id
router.delete(
  "/banned-words/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  deleteBannedWordById,
);

// Create a route for setting dates for a holiday
router.patch(
  "/holidays/:id/dates",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  setHolidayDatesById,
);

// Create a route for setting dates for a season
router.patch(
  "/seasons/:id/dates",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  setSeasonDatesById,
);

// Create a route for updating a rule-based holiday to have new dates when entering a new year
router.patch(
  "/holidays/:id/rule-based-dates",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  updateRuleBasedHolidayDatesById,
);

// Create a route for updating a rule-based season to have new dates when entering a new year
router.patch(
  "/seasons/:id/rule-based-dates",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  updateRuleBasedSeasonDatesById,
);

// Create a route for updating all rule-based collections to have new dates when entering a new year
router.patch(
  "/collections/rule-based-dates",
  protectRoute,
  requireRole(["moderator", "admin"]),
  updateAllRuleBasedSeasonAndHolidayDates,
);

// Create a route for getting all seasons and holidays that do not have dates set yet
router.get(
  "/collections/without-dates",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getUndatedSeasonsAndHolidays,
);

// Create a route for deleting an array of meals by their titles
router.delete(
  "/meals",
  protectRoute,
  requireRole(["admin"]),
  deleteMealsByTitles,
);

// Create a route for deleting an array of cuisines by their titles
router.delete(
  "/cuisines",
  protectRoute,
  requireRole(["admin"]),
  deleteCuisinesByTitles,
);

// Create a route for deleting an array of holidays by their titles
router.delete(
  "/holidays",
  protectRoute,
  requireRole(["admin"]),
  deleteHolidaysByTitles,
);

// Create a route for deleting an array of seasons by their titles
router.delete(
  "/seasons",
  protectRoute,
  requireRole(["admin"]),
  deleteSeasonsByTitles,
);

// Create a route for deleting an array of tags by their titles
router.delete(
  "/tags",
  protectRoute,
  requireRole(["admin"]),
  deleteTagsByTitles,
);

// Create a route for getting all ingredients and their index status
router.get(
  "/ingredients",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getIngredients,
);

// Create a route for updating if a ingredient should be indexed or not by its id
router.patch(
  "/ingredients/:id/index",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  updateIngredientIndexById,
);

// Create a route for deleting an array of ingredients by their titles
router.delete(
  "/ingredients",
  protectRoute,
  requireRole(["admin"]),
  deleteIngredientsByTitles,
);

// Create a route for creating a new measurement
router.post(
  "/measurements",
  protectRoute,
  requireRole(["moderator", "admin"]),
  createMeasurementUnit,
);

// Create a route for updating an existing measurement
router.patch(
  "/measurements/:id",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  updateMeasurementUnitById,
);

// Create a route for getting all logs
router.get("/logs", protectRoute, requireRole(["admin"]), getLogs);

// Create a route for deleting a log by id
router.delete(
  "/logs/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  deleteLogById,
);

// Create a route for getting all reports
router.get(
  "/reports",
  protectRoute,
  requireRole(["moderator", "admin"]),
  getReports,
);

// Create a route for updating the status of a report
router.patch(
  "/reports/:id",
  protectRoute,
  requireRole(["moderator", "admin"]),
  validateObjectId("id"),
  updateReportStatus,
);

// Create a route for deleting a report
router.delete(
  "/reports/:id",
  protectRoute,
  requireRole(["admin"]),
  validateObjectId("id"),
  deleteReportById,
);

export default router;
