import mongoose from "mongoose";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "@jest/globals";
import request from "supertest";
import app from "../../../src/app.js";

import {
  getAuthenticatedAgent,
  createTestUser,
  testUserData,
  createTestModeratorUser,
  createTestAdminUser,
  createTestHoliday,
  getNthWeekdayOfMonth,
  createTestSeason,
  createTestTag,
  createTestIngredient,
  createTestMeasurement,
  createTestLog,
  createTestReport,
  createTestMeal,
  createTestCuisine,
} from "../../../src/utils/testFunctions.js";

import User from "../../../src/models/user.model.js";
import BannedWord from "../../../src/models/BannedWord.model.js";
import Log from "../../../src/models/log.model.js";
import Report from "../../../src/models/report.model.js";
import Holiday from "../../../src/models/holiday.model.js";
import Season from "../../../src/models/season.model.js";
import Tag from "../../../src/models/tag.model.js";
import Meal from "../../../src/models/meal.model.js";
import Cuisine from "../../../src/models/cuisine.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";
import Measurement from "../../../src/models/measurement.model.js";

// Base test setup //

let testUser;
let loginAgent;
let moderatorUser;
let moderatorAgent;
let adminUser;
let adminAgent;

// Delete all users and create a new authenticated agent before running the tests
beforeAll(async () => {
  await User.deleteMany({});

  testUser = await createTestUser(testUserData);
  loginAgent = await getAuthenticatedAgent(testUser);
  moderatorUser = await createTestModeratorUser();
  moderatorAgent = await getAuthenticatedAgent(moderatorUser);
  adminUser = await createTestAdminUser();
  adminAgent = await getAuthenticatedAgent(adminUser);
});

beforeEach(async () => {
  await BannedWord.deleteMany({});
  await Log.deleteMany({});
  await Report.deleteMany({});
  await Holiday.deleteMany({});
  await Season.deleteMany({});
  await Tag.deleteMany({});
  await Ingredient.deleteMany({});
  await Measurement.deleteMany({});
});

// Test cases: getBannedWords //
describe("GET /api/v1/admin/metadata/banned-words", () => {
  it("should return an empty array if there are no banned words", async () => {
    const res = await adminAgent.get("/api/v1/admin/metadata/banned-words");

    expect(res.statusCode).toEqual(200);
    expect(res.body.bannedWords.bannedWords.length).toBe(0);
    expect(res.body.bannedWords.currentPage).toBe(1);
    expect(res.body.bannedWords.totalBannedWords).toBe(0);
    expect(res.body.bannedWords.totalPages).toBe(0);
  });

  it("should return a list of banned words with pagination", async () => {
    // Create 15 banned words
    const bannedWordsData = Array.from({ length: 15 }, (_, i) => ({
      word: `bannedword${i + 1}`,
      severity: i % 2 === 0 ? "block" : "flag",
    }));

    await BannedWord.insertMany(
      bannedWordsData.map((wordData) => ({
        ...wordData,
        authorId: adminUser._id,
      })),
    );

    const res = await adminAgent.get("/api/v1/admin/metadata/banned-words");

    expect(res.statusCode).toEqual(200);
    expect(res.body.bannedWords.bannedWords.length).toBe(10);
    expect(res.body.bannedWords.currentPage).toBe(1);
    expect(res.body.bannedWords.totalBannedWords).toBe(15);
    expect(res.body.bannedWords.totalPages).toBe(2);
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/metadata/banned-words");

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to access banned words", async () => {
    const res = await loginAgent.get("/api/v1/admin/metadata/banned-words");

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to access banned words", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/metadata/banned-words");

    expect(res.statusCode).toEqual(200);
    expect(res.body.bannedWords).toBeDefined();
  });

  it("should allow an admin to access banned words", async () => {
    const res = await adminAgent.get("/api/v1/admin/metadata/banned-words");

    expect(res.statusCode).toEqual(200);
    expect(res.body.bannedWords).toBeDefined();
  });
});

// Test cases: addBannedWords //
describe("POST /api/v1/admin/metadata/banned-words", () => {
  it("should add new banned words and return them", async () => {
    const newBannedWords = [
      { word: "testbannedword1", severity: "block" },
      { word: "testbannedword2", severity: "flag" },
    ];

    const res = await adminAgent
      .post("/api/v1/admin/metadata/banned-words")
      .send({ newBannedWords: newBannedWords });

    expect(res.statusCode).toEqual(201);
    expect(res.body.bannedWords.length).toBe(2);
    expect(res.body.bannedWords[0].word).toBe("testbannedword1");
    expect(res.body.bannedWords[1].word).toBe("testbannedword2");
  });

  it("should throw an error if new banned words are not provided", async () => {
    const res = await adminAgent
      .post("/api/v1/admin/metadata/banned-words")
      .send({ newBannedWords: [] });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "New banned words must be a non-empty array of words",
    );
  });

  it("should throw an error if a user is not authenticated", async () => {
    const res = await request(app)
      .post("/api/v1/admin/metadata/banned-words")
      .send({
        newBannedWords: [{ word: "testbannedword", severity: "block" }],
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to add banned words", async () => {
    const res = await loginAgent
      .post("/api/v1/admin/metadata/banned-words")
      .send({
        newBannedWords: [{ word: "testbannedword", severity: "block" }],
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to add banned words", async () => {
    const res = await moderatorAgent
      .post("/api/v1/admin/metadata/banned-words")
      .send({
        newBannedWords: [{ word: "testbannedword", severity: "block" }],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.bannedWords.length).toBe(1);
    expect(res.body.bannedWords[0].word).toBe("testbannedword");
  });

  it("should allow an admin to add banned words", async () => {
    const res = await adminAgent
      .post("/api/v1/admin/metadata/banned-words")
      .send({
        newBannedWords: [{ word: "testbannedword", severity: "block" }],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.bannedWords.length).toBe(1);
    expect(res.body.bannedWords[0].word).toBe("testbannedword");
  });
});

// Test cases: updateBannedWordById //
describe("PATCH /api/v1/admin/metadata/banned-words/:id", () => {
  it("should update a banned word's word, severity and authorId", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const testReport = await Report.create({
      reportingUserId: testUser._id,
      targetId: bannedWord._id,
    });

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
        reportId: testReport._id,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedBannedWord.word).toBe("updatedlogtestword");
    expect(res.body.updatedBannedWord.severity).toBe("flag");
    expect(res.body.updatedBannedWord.authorId).toBe(adminUser._id.toString());
  });

  it("should throw an error if the banned word does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/banned-words/${nonExistentId}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
      });
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Banned word not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await request(app)
      .patch(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update a banned word", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await loginAgent
      .patch(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to update a banned word", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await moderatorAgent
      .patch(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to update a banned word", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedBannedWord.word).toBe("updatedlogtestword");
    expect(res.body.updatedBannedWord.severity).toBe("flag");
    expect(res.body.updatedBannedWord.authorId).toBe(adminUser._id.toString());
  });

  it("should throw an error if the provided id is not a valid ObjectId", async () => {
    const invalidId = "12345";

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/banned-words/${invalidId}`)
      .send({
        word: "UpdatedLogTestWord",
        severity: "flag",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: deleteBannedWordById //
describe("DELETE /api/v1/admin/metadata/banned-words/:id", () => {
  it("should delete a banned word by id", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const testReport = await Report.create({
      reportingUserId: testUser._id,
      targetId: bannedWord._id,
    });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({ reportId: testReport._id });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted banned word");

    const deletedBannedWord = await BannedWord.findById(bannedWord._id);

    expect(deletedBannedWord).toBeNull();
  });

  it("should throw an error if the banned word does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/banned-words/${nonExistentId}`)
      .send({});

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Banned word not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await request(app)
      .delete(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({});

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete a banned word", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({});

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete a banned word", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({});

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete a banned word", async () => {
    const bannedWord = await BannedWord.create({
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/banned-words/${bannedWord._id}`)
      .send({});

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted banned word");

    const deletedBannedWord = await BannedWord.findById(bannedWord._id);

    expect(deletedBannedWord).toBeNull();
  });

  it("should throw an error if the provided id is not a valid ObjectId", async () => {
    const invalidId = "12345";

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/banned-words/${invalidId}`)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: setHolidayDatesById //
describe("PATCH /api/v1/admin/metadata/holidays/:id/dates", () => {
  it("should update holiday dates", async () => {
    const holiday = await createTestHoliday();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/holidays/${holiday._id}/dates`)
      .send({
        type: "fixed",
        startDate: "12/24/2026",
        endDate: "12/26/2026",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set holiday dates");
    expect(res.body.updatedHoliday.type).toBe("fixed");
    expect(
      new Date(res.body.updatedHoliday.startDate).toLocaleDateString(),
    ).toBe("12/24/2026");
    expect(new Date(res.body.updatedHoliday.endDate).toLocaleDateString()).toBe(
      "12/26/2026",
    );
  });

  it("should update a rule based holiday dates", async () => {
    const holiday = await createTestHoliday();

    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/holidays/${holiday._id}/dates`)
      .send({
        type: "rule-based",
        month: month + 1,
        weekday,
        week,
        duration,
      });

    const expectedStartDate = getNthWeekdayOfMonth(
      today.getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set holiday dates");
    expect(res.body.updatedHoliday.type).toBe("rule-based");
    expect(res.body.updatedHoliday.month).toBe(month + 1);
    expect(res.body.updatedHoliday.weekday).toBe(1);
    expect(res.body.updatedHoliday.week).toBe(2);
    expect(res.body.updatedHoliday.duration).toBe(2);
    expect(
      new Date(res.body.updatedHoliday.startDate).toLocaleDateString(),
    ).toBe(expectedStartDate.toLocaleDateString());
    expect(new Date(res.body.updatedHoliday.endDate).toLocaleDateString()).toBe(
      expectedEndDate.toLocaleDateString(),
    );
  });

  it("should throw an error if the holiday does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/holidays/${nonExistentId}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Holiday with the provided id not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const holiday = await createTestHoliday();

    const res = await request(app)
      .patch(`/api/v1/admin/metadata/holidays/${holiday._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update holiday dates", async () => {
    const holiday = await createTestHoliday();

    const res = await loginAgent
      .patch(`/api/v1/admin/metadata/holidays/${holiday._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update holiday dates", async () => {
    const holiday = await createTestHoliday();

    const res = await moderatorAgent
      .patch(`/api/v1/admin/metadata/holidays/${holiday._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set holiday dates");
  });

  it("should allow an admin to update holiday dates", async () => {
    const holiday = await createTestHoliday();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/holidays/${holiday._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set holiday dates");
  });

  it("should throw an error if the provided id is not a valid ObjectId", async () => {
    const invalidId = "12345";

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/holidays/${invalidId}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: setSeasonDatesById //
describe("PATCH /api/v1/admin/metadata/seasons/:id/dates", () => {
  it("should update season dates", async () => {
    const season = await createTestSeason();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/seasons/${season._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set season dates");
    expect(res.body.updatedSeason.type).toBe("fixed");
    expect(
      new Date(res.body.updatedSeason.startDate).toLocaleDateString(),
    ).toBe("12/24/2024");
    expect(new Date(res.body.updatedSeason.endDate).toLocaleDateString()).toBe(
      "12/26/2024",
    );
  });

  it("should update season dates for a rule-based season", async () => {
    const season = await createTestSeason();

    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/seasons/${season._id}/dates`)
      .send({ type: "rule-based", month: month + 1, weekday, week, duration });

    const expectedStartDate = getNthWeekdayOfMonth(
      today.getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set season dates");
    expect(res.body.updatedSeason.type).toBe("rule-based");
    expect(res.body.updatedSeason.month).toBe(month + 1);
    expect(res.body.updatedSeason.weekday).toBe(1);
    expect(res.body.updatedSeason.week).toBe(2);
    expect(res.body.updatedSeason.duration).toBe(2);
    expect(
      new Date(res.body.updatedSeason.startDate).toLocaleDateString(),
    ).toBe(expectedStartDate.toLocaleDateString());
    expect(new Date(res.body.updatedSeason.endDate).toLocaleDateString()).toBe(
      expectedEndDate.toLocaleDateString(),
    );
  });

  it("should throw an error if the season does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/seasons/${nonExistentId}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Season with the provided id not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const season = await createTestSeason();

    const res = await request(app)
      .patch(`/api/v1/admin/metadata/seasons/${season._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update season dates", async () => {
    const season = await createTestSeason();

    const res = await loginAgent
      .patch(`/api/v1/admin/metadata/seasons/${season._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update season dates", async () => {
    const season = await createTestSeason();

    const res = await moderatorAgent
      .patch(`/api/v1/admin/metadata/seasons/${season._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set season dates");
  });

  it("should allow an admin to update season dates", async () => {
    const season = await createTestSeason();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/seasons/${season._id}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Set season dates");
  });

  it("should throw an error if the provided id is not a valid ObjectId", async () => {
    const invalidId = "12345";

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/seasons/${invalidId}/dates`)
      .send({ type: "fixed", startDate: "2024/12/24", endDate: "2024/12/26" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: updateRuleBasedHolidayDatesById //
describe("PATCH /api/v1/admin/metadata/holidays/:id/rule-based-dates", () => {
  it("should update rule-based holiday dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const holiday = await createTestHoliday({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/holidays/${holiday._id}/rule-based-dates`,
    );

    const expectedStartDate = getNthWeekdayOfMonth(
      today.getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based holiday dates");
    expect(
      new Date(res.body.updatedHoliday.startDate).toLocaleDateString(),
    ).toBe(expectedStartDate.toLocaleDateString());
    expect(new Date(res.body.updatedHoliday.endDate).toLocaleDateString()).toBe(
      expectedEndDate.toLocaleDateString(),
    );
  });

  it("should throw an error if the holiday does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/holidays/${nonExistentId}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Rule-based document not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const holiday = await createTestHoliday();

    const res = await request(app).patch(
      `/api/v1/admin/metadata/holidays/${holiday._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update rule-based holiday dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const holiday = await createTestHoliday({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await loginAgent.patch(
      `/api/v1/admin/metadata/holidays/${holiday._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update rule-based holiday dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const holiday = await createTestHoliday({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await moderatorAgent.patch(
      `/api/v1/admin/metadata/holidays/${holiday._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based holiday dates");
  });

  it("should allow an admin to update rule-based holiday dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const holiday = await createTestHoliday({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/holidays/${holiday._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based holiday dates");
  });

  test("should throw an error if the provided id is not a valid ObjectId", async () => {
    const invalidId = "12345";

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/holidays/${invalidId}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: updateRuleBasedSeasonDatesById //
describe("PATCH /api/v1/admin/metadata/seasons/:id/rule-based-dates", () => {
  it("should update rule-based season dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const season = await createTestSeason({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/seasons/${season._id}/rule-based-dates`,
    );

    const expectedStartDate = getNthWeekdayOfMonth(
      today.getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + duration - 1);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based season dates");
    expect(res.body.updatedSeason.type).toBe("rule-based");
    expect(
      new Date(res.body.updatedSeason.startDate).toLocaleDateString(),
    ).toBe(expectedStartDate.toLocaleDateString());
    expect(new Date(res.body.updatedSeason.endDate).toLocaleDateString()).toBe(
      expectedEndDate.toLocaleDateString(),
    );
  });

  it("should throw an error if the season does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/seasons/${nonExistentId}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Rule-based document not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const season = await createTestSeason({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await request(app).patch(
      `/api/v1/admin/metadata/seasons/${season._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update rule-based season dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const season = await createTestSeason({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await loginAgent.patch(
      `/api/v1/admin/metadata/seasons/${season._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update rule-based season dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const season = await createTestSeason({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await moderatorAgent.patch(
      `/api/v1/admin/metadata/seasons/${season._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based season dates");
  });

  it("should allow an admin to update rule-based season dates", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const season = await createTestSeason({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/seasons/${season._id}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based season dates");
  });

  it("should throw an error if the provided id is not a valid ObjectId", async () => {
    const invalidId = "12345";

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/seasons/${invalidId}/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: updateAllRuleBasedSeasonAndHolidayDates //
describe("PATCH /api/v1/admin/metadata/collections/rule-based-dates", () => {
  it("should update all rule-based seasons and holidays to have new dates when entering a new year", async () => {
    const today = new Date();
    const month = 1;
    const weekday = 1;
    const week = 2;
    const duration = 2;

    const season = await createTestSeason({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const holiday = await createTestHoliday({
      type: "rule-based",
      month: month + 1,
      weekday,
      week,
      duration,
      startDate: `1/1/${today.getFullYear() - 1}`,
      endDate: `1/3/${today.getFullYear() - 1}`,
    });

    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/collections/rule-based-dates`,
    );

    const expectedStartDate = getNthWeekdayOfMonth(
      today.getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + duration - 1);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based collection dates");
    expect(res.body.updatedSeasons[0].type).toBe("rule-based");
    expect(
      new Date(res.body.updatedSeasons[0].startDate).toLocaleDateString(),
    ).toEqual(expectedStartDate.toLocaleDateString());
    expect(
      new Date(res.body.updatedSeasons[0].endDate).toLocaleDateString(),
    ).toEqual(expectedEndDate.toLocaleDateString());
    expect(res.body.updatedHolidays[0].type).toBe("rule-based");
    expect(
      new Date(res.body.updatedHolidays[0].startDate).toLocaleDateString(),
    ).toEqual(expectedStartDate.toLocaleDateString());
    expect(
      new Date(res.body.updatedHolidays[0].endDate).toLocaleDateString(),
    ).toEqual(expectedEndDate.toLocaleDateString());
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).patch(
      `/api/v1/admin/metadata/collections/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update rule-based dates", async () => {
    const res = await loginAgent.patch(
      `/api/v1/admin/metadata/collections/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update rule-based dates", async () => {
    const res = await moderatorAgent.patch(
      `/api/v1/admin/metadata/collections/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based collection dates");
  });

  it("should allow an admin to update rule-based dates", async () => {
    const res = await adminAgent.patch(
      `/api/v1/admin/metadata/collections/rule-based-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated rule-based collection dates");
  });
});

// Test cases: getUndatedSeasonsAndHolidays //
describe("GET /api/v1/admin/metadata/collections/without-dates", () => {
  it("should return lists of undated seasons and holidays", async () => {
    await createTestSeason({
      type: "rule-based",
      month: 1,
      weekday: 1,
      week: 2,
      duration: 2,
      startDate: `1/1/${new Date().getFullYear() - 1}`,
      endDate: `1/3/${new Date().getFullYear() - 1}`,
    });
    await createTestHoliday({
      type: "rule-based",
      month: 1,
      weekday: 1,
      week: 2,
      duration: 2,
      startDate: `1/1/${new Date().getFullYear() - 1}`,
      endDate: `1/3/${new Date().getFullYear() - 1}`,
    });

    const undatedSeason = await createTestSeason({ title: "Undated Season" });
    const undatedHoliday = await createTestHoliday({
      title: "Undated Holiday",
    });

    const res = await adminAgent.get(
      `/api/v1/admin/metadata/collections/without-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved undated collections");
    expect(res.body.undatedSeasons.length).toBe(1);
    expect(res.body.undatedHolidays.length).toBe(1);
    expect(res.body.undatedSeasons[0]._id.toString()).toBe(
      undatedSeason._id.toString(),
    );
    expect(res.body.undatedHolidays[0]._id.toString()).toBe(
      undatedHoliday._id.toString(),
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).get(
      `/api/v1/admin/metadata/collections/without-dates`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to get undated collections", async () => {
    const res = await loginAgent.get(
      `/api/v1/admin/metadata/collections/without-dates`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to get undated collections", async () => {
    const res = await moderatorAgent.get(
      `/api/v1/admin/metadata/collections/without-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved undated collections");
  });

  it("should allow an admin to get undated collections", async () => {
    const res = await adminAgent.get(
      `/api/v1/admin/metadata/collections/without-dates`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved undated collections");
  });
});

// Test cases: deleteMealsByTitles //
describe("DELETE /api/v1/admin/metadata/meals", () => {
  it("should delete meals by titles", async () => {
    const meal1 = await createTestMeal({ title: "Meal 1" });
    const meal2 = await createTestMeal({ title: "Meal 2" });
    const meal3 = await createTestMeal({ title: "Meal 3" });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/meals`)
      .send({ mealTitles: ["Meal 1", "Meal 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted meals");

    const deletedMeal1 = await Meal.findById(meal1._id);
    const deletedMeal2 = await Meal.findById(meal2._id);
    const deletedMeal3 = await Meal.findById(meal3._id);

    expect(deletedMeal1).toBeNull();
    expect(deletedMeal2).toBeNull();
    expect(deletedMeal3).not.toBeNull();
  });

  it("should throw an error if no titles are provided", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/meals`)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Meal titles must be a non-empty array of strings",
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/metadata/meals`)
      .send({ mealTitles: ["Meal 1", "Meal 2"] });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete meals", async () => {
    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/meals`)
      .send({ mealTitles: ["Meal 1", "Meal 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete meals", async () => {
    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/meals`)
      .send({ mealTitles: ["Meal 1", "Meal 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete meals", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/meals`)
      .send({ mealTitles: ["Meal 1", "Meal 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted meals");
  });
});

// Test cases: deleteCuisinesByTitles //
describe("DELETE /api/v1/admin/metadata/cuisines", () => {
  it("should delete cuisines by titles", async () => {
    const cuisine1 = await createTestCuisine({ title: "Cuisine 1" });
    const cuisine2 = await createTestCuisine({ title: "Cuisine 2" });
    const cuisine3 = await createTestCuisine({ title: "Cuisine 3" });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/cuisines`)
      .send({ cuisineTitles: ["Cuisine 1", "Cuisine 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted cuisines");

    const deletedCuisine1 = await Cuisine.findById(cuisine1._id);
    const deletedCuisine2 = await Cuisine.findById(cuisine2._id);
    const deletedCuisine3 = await Cuisine.findById(cuisine3._id);

    expect(deletedCuisine1).toBeNull();
    expect(deletedCuisine2).toBeNull();
    expect(deletedCuisine3).not.toBeNull();
  });

  it("should throw an error if no titles are provided", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/cuisines`)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Cuisine titles must be a non-empty array of strings",
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/metadata/cuisines`)
      .send({ cuisineTitles: ["Cuisine 1", "Cuisine 2"] });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete cuisines", async () => {
    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/cuisines`)
      .send({ cuisineTitles: ["Cuisine 1", "Cuisine 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete cuisines", async () => {
    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/cuisines`)
      .send({ cuisineTitles: ["Cuisine 1", "Cuisine 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete cuisines", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/cuisines`)
      .send({ cuisineTitles: ["Cuisine 1", "Cuisine 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted cuisines");
  });
});

// Test cases: deleteHolidaysByTitles //
describe("DELETE /api/v1/admin/metadata/holidays", () => {
  it("should delete holidays by titles", async () => {
    const holiday1 = await createTestHoliday({ title: "Holiday 1" });
    const holiday2 = await createTestHoliday({ title: "Holiday 2" });
    const holiday3 = await createTestHoliday({ title: "Holiday 3" });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/holidays`)
      .send({ holidayTitles: ["Holiday 1", "Holiday 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted holidays");

    const deletedHoliday1 = await Holiday.findById(holiday1._id);
    const deletedHoliday2 = await Holiday.findById(holiday2._id);
    const deletedHoliday3 = await Holiday.findById(holiday3._id);

    expect(deletedHoliday1).toBeNull();
    expect(deletedHoliday2).toBeNull();
    expect(deletedHoliday3).not.toBeNull();
  });

  it("should throw an error if no titles are provided", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/holidays`)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Holiday titles must be a non-empty array of strings",
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/metadata/holidays`)
      .send({ holidayTitles: ["Holiday 1", "Holiday 2"] });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete holidays", async () => {
    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/holidays`)
      .send({ holidayTitles: ["Holiday 1", "Holiday 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete holidays", async () => {
    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/holidays`)
      .send({ holidayTitles: ["Holiday 1", "Holiday 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete holidays", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/holidays`)
      .send({ holidayTitles: ["Holiday 1", "Holiday 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted holidays");
  });
});

// Test cases: deleteSeasonsByTitles //
describe("DELETE /api/v1/admin/metadata/seasons", () => {
  it("should delete seasons by titles", async () => {
    const season1 = await createTestSeason({ title: "Season 1" });
    const season2 = await createTestSeason({ title: "Season 2" });
    const season3 = await createTestSeason({ title: "Season 3" });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/seasons`)
      .send({ seasonTitles: ["Season 1", "Season 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted seasons");

    const deletedSeason1 = await Season.findById(season1._id);
    const deletedSeason2 = await Season.findById(season2._id);
    const deletedSeason3 = await Season.findById(season3._id);

    expect(deletedSeason1).toBeNull();
    expect(deletedSeason2).toBeNull();
    expect(deletedSeason3).not.toBeNull();
  });

  it("should throw an error if no titles are provided", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/seasons`)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Season titles must be a non-empty array of strings",
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/metadata/seasons`)
      .send({ seasonTitles: ["Season 1", "Season 2"] });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete seasons", async () => {
    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/seasons`)
      .send({ seasonTitles: ["Season 1", "Season 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete seasons", async () => {
    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/seasons`)
      .send({ seasonTitles: ["Season 1", "Season 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete seasons", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/seasons`)
      .send({ seasonTitles: ["Season 1", "Season 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted seasons");
  });
});

// Test cases: deleteTagsByTitles //
describe("DELETE /api/v1/admin/metadata/tags", () => {
  it("should delete tags by titles", async () => {
    const tag1 = await createTestTag({ title: "Tag 1" });
    const tag2 = await createTestTag({ title: "Tag 2" });
    const tag3 = await createTestTag({ title: "Tag 3" });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/tags`)
      .send({ tagTitles: ["Tag 1", "Tag 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted tags");

    const deletedTag1 = await Tag.findById(tag1._id);
    const deletedTag2 = await Tag.findById(tag2._id);
    const deletedTag3 = await Tag.findById(tag3._id);

    expect(deletedTag1).toBeNull();
    expect(deletedTag2).toBeNull();
    expect(deletedTag3).not.toBeNull();
  });

  it("should throw an error if no titles are provided", async () => {
    const res = await adminAgent.delete(`/api/v1/admin/metadata/tags`).send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Tag titles must be a non-empty array of strings",
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/metadata/tags`)
      .send({ tagTitles: ["Tag 1", "Tag 2"] });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete tags", async () => {
    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/tags`)
      .send({ tagTitles: ["Tag 1", "Tag 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete tags", async () => {
    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/tags`)
      .send({ tagTitles: ["Tag 1", "Tag 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete tags", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/tags`)
      .send({ tagTitles: ["Tag 1", "Tag 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted tags");
  });
});

// Test cases: getIngredients //
describe("GET /api/v1/admin/metadata/ingredients", () => {
  it("should return a list of ingredients with their index status where uninexed ingredients are first", async () => {
    for (let i = 1; i <= 3; i++) {
      await createTestIngredient({
        title: `Ingredient ${i}`,
        indexItem: i % 2 === 0 ? true : false,
      });
    }

    const res = await adminAgent.get(`/api/v1/admin/metadata/ingredients`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved ingredients");
    expect(res.body.ingredients.length).toBe(3);
    expect(res.body.ingredients[0].title).toBe("ingredient 1");
    expect(res.body.ingredients[0].indexItem).toBe(false);
    expect(res.body.ingredients[1].title).toBe("ingredient 3");
    expect(res.body.ingredients[1].indexItem).toBe(false);
    expect(res.body.ingredients[2].title).toBe("ingredient 2");
    expect(res.body.ingredients[2].indexItem).toBe(true);
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).get(`/api/v1/admin/metadata/ingredients`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to get ingredients", async () => {
    const res = await loginAgent.get(`/api/v1/admin/metadata/ingredients`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to get ingredients", async () => {
    const res = await moderatorAgent.get(`/api/v1/admin/metadata/ingredients`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved ingredients");
  });

  it("should allow an admin to get ingredients", async () => {
    const res = await adminAgent.get(`/api/v1/admin/metadata/ingredients`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved ingredients");
  });
});

// Test cases: updateIngredientIndexById //
describe("PATCH /api/v1/admin/metadata/ingredients/:id/index", () => {
  it("should update the index status of an ingredient by id", async () => {
    const ingredient = await createTestIngredient({
      title: "Ingredient 1",
      indexItem: false,
    });

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/ingredients/${ingredient._id}/index`)
      .send();

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated ingredient index");
    expect(res.body.ingredient.indexItem).toBe(true);
  });

  it("should throw an error if the ingredient does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/ingredients/${nonExistentId}/index`)
      .send();

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Ingredient not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/metadata/ingredients/:id/index`)
      .send();

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to update an ingredient index", async () => {
    const res = await loginAgent
      .patch(`/api/v1/admin/metadata/ingredients/:id/index`)
      .send();

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to update an ingredient index", async () => {
    const res = await moderatorAgent
      .patch(`/api/v1/admin/metadata/ingredients/:id/index`)
      .send();

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to update an ingredient index", async () => {
    const ingredient = await createTestIngredient({
      title: "Ingredient 1",
      indexItem: false,
    });

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/ingredients/${ingredient._id}/index`)
      .send();

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated ingredient index");
  });

  it("should throw an error if the ingredient id is invalid", async () => {
    const invalidId = "12345";

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/ingredients/${invalidId}/index`)
      .send({ indexItem: true });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: deleteIngredientsByTitles //
describe("DELETE /api/v1/admin/metadata/ingredients", () => {
  it("should delete ingredients by titles", async () => {
    const ingredient1 = await createTestIngredient({ title: "Ingredient 1" });
    const ingredient2 = await createTestIngredient({ title: "Ingredient 2" });
    const ingredient3 = await createTestIngredient({ title: "Ingredient 3" });

    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/ingredients`)
      .send({ ingredientTitles: ["Ingredient 1", "Ingredient 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted ingredients");

    const deletedIngredient1 = await Ingredient.findById(ingredient1._id);
    const deletedIngredient2 = await Ingredient.findById(ingredient2._id);
    const deletedIngredient3 = await Ingredient.findById(ingredient3._id);

    expect(deletedIngredient1).toBeNull();
    expect(deletedIngredient2).toBeNull();
    expect(deletedIngredient3).not.toBeNull();
  });

  it("should throw an error if no titles are provided", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/ingredients`)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe(
      "Ingredient titles must be a non-empty array of strings",
    );
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/metadata/ingredients`)
      .send({ ingredientTitles: ["Ingredient 1", "Ingredient 2"] });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if a general user tries to delete ingredients", async () => {
    const res = await loginAgent
      .delete(`/api/v1/admin/metadata/ingredients`)
      .send({ ingredientTitles: ["Ingredient 1", "Ingredient 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if a moderator tries to delete ingredients", async () => {
    const res = await moderatorAgent
      .delete(`/api/v1/admin/metadata/ingredients`)
      .send({ ingredientTitles: ["Ingredient 1", "Ingredient 2"] });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete ingredients", async () => {
    const res = await adminAgent
      .delete(`/api/v1/admin/metadata/ingredients`)
      .send({ ingredientTitles: ["Ingredient 1", "Ingredient 2"] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted ingredients");
  });
});

// Test cases: createMeasurementUnit //
describe("POST /api/v1/admin/metadata/measurements", () => {
  it("should create a new measurement unit", async () => {
    const res = await adminAgent
      .post(`/api/v1/admin/metadata/measurements`)
      .send({
        title: "cup",
        system: "Metric",
        baseUnit: "volume",
        toBaseFactor: 0.25,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.newMeasurement.title).toBe("cup");
    expect(res.body.newMeasurement.system).toBe("metric");
    expect(res.body.newMeasurement.baseUnit).toBe("volume");
    expect(res.body.newMeasurement.toBaseFactor).toBe(0.25);
    expect(res.body.message).toBe("Created measurement unit");
  });

  it("should throw an error if measurement title is missing", async () => {
    const res = await adminAgent
      .post(`/api/v1/admin/metadata/measurements`)
      .send({
        system: "Metric",
        baseUnit: "volume",
        toBaseFactor: 0.25,
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Missing required fields");
  });

  it("should throw an error if user is not authenticated", async () => {
    const res = await request(app)
      .post(`/api/v1/admin/metadata/measurements`)
      .send({
        title: "cup",
        system: "Metric",
        baseUnit: "volume",
        toBaseFactor: 0.25,
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if user is a general user", async () => {
    const res = await loginAgent
      .post(`/api/v1/admin/metadata/measurements`)
      .send({
        title: "cup",
        system: "Metric",
        baseUnit: "volume",
        toBaseFactor: 0.25,
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to create a measurement unit", async () => {
    const res = await moderatorAgent
      .post(`/api/v1/admin/metadata/measurements`)
      .send({
        title: "cup",
        system: "Metric",
        baseUnit: "volume",
        toBaseFactor: 0.25,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe("Created measurement unit");
  });

  it("should allow an admin to create a measurement unit", async () => {
    const res = await adminAgent
      .post(`/api/v1/admin/metadata/measurements`)
      .send({
        title: "cup",
        system: "Metric",
        baseUnit: "volume",
        toBaseFactor: 0.25,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe("Created measurement unit");
  });
});

// Test cases: updateMeasurementUnitById //
describe("PATCH /api/v1/admin/metadata/measurements/:id", () => {
  it("should update a measurement unit", async () => {
    const measurement = await createTestMeasurement();

    const originalMeasurement = await Measurement.findOne({
      _id: measurement._id,
    });

    expect(originalMeasurement.title).toBe("cup");
    expect(originalMeasurement.system).toBe("us customary");
    expect(originalMeasurement.baseUnit).toBe("volume");
    expect(originalMeasurement.toBaseFactor).toBe(1);

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/measurements/${measurement._id}`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedMeasurement.title).toBe("cup");
    expect(res.body.updatedMeasurement.system).toBe("metric");
    expect(res.body.updatedMeasurement.baseUnit).toBe("weight");
    expect(res.body.updatedMeasurement.toBaseFactor).toBe(0);
    expect(res.body.message).toBe("Updated measurement unit");
  });

  it("should throw an error if measurement does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/measurements/${nonExistentId}`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Measurement unit not found");
  });

  it("should throw an error if user is not authenticated", async () => {
    const measurement = await createTestMeasurement();

    const res = await request(app)
      .patch(`/api/v1/admin/metadata/measurements/${measurement._id}`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if user is a general user", async () => {
    const measurement = await createTestMeasurement();

    const res = await loginAgent
      .patch(`/api/v1/admin/metadata/measurements/${measurement._id}`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update a measurement unit", async () => {
    const measurement = await createTestMeasurement();

    const res = await moderatorAgent
      .patch(`/api/v1/admin/metadata/measurements/${measurement._id}`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated measurement unit");
  });

  it("should allow an admin to update a measurement unit", async () => {
    const measurement = await createTestMeasurement();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/measurements/${measurement._id}`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated measurement unit");
  });

  it("should throw an error if id is not valid", async () => {
    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/measurements/invalidId`)
      .send({
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 0,
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: getLogs //
describe("GET /api/v1/admin/metadata/logs", () => {
  it("should get all logs in order from oldest to newest", async () => {
    for (let i = 0; i < 10; i++) {
      await createTestLog(testUser._id, "SET_COLLECTION_DATES", null, null);
    }

    const res = await adminAgent.get("/api/v1/admin/metadata/logs");

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved logs");
    expect(res.body.logs.length).toBe(10);
    // Check that the logs are returned in the correct order (oldest first)
    for (let i = 0; i < res.body.logs.length - 1; i++) {
      const currentLog = res.body.logs[i];
      const nextLog = res.body.logs[i + 1];
      expect(currentLog.action).toBe("SET_COLLECTION_DATES");
      expect(nextLog.action).toBe("SET_COLLECTION_DATES");
      expect(
        new Date(currentLog.createdAt) <= new Date(nextLog.createdAt),
      ).toBe(true);
    }
  });

  it("should throw an error if user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/metadata/logs");

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/metadata/logs");

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if user is a moderator", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/metadata/logs");

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to get logs", async () => {
    const res = await adminAgent.get("/api/v1/admin/metadata/logs");

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved logs");
  });
});

// Test cases: deleteLogById //
describe("DELETE /api/v1/admin/metadata/logs/:id", () => {
  it("should delete a log by id", async () => {
    const log = await createTestLog(
      testUser._id,
      "SET_COLLECTION_DATES",
      null,
      null,
    );

    const existingLog = await Log.findById(log._id);
    expect(existingLog).not.toBeNull();

    const res = await adminAgent.delete(
      `/api/v1/admin/metadata/logs/${log._id}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted log");

    const deletedLog = await Log.findById(log._id);
    expect(deletedLog).toBeNull();
  });

  it("should throw an error if the user is not authenticated", async () => {
    const log = await createTestLog(
      testUser._id,
      "SET_COLLECTION_DATES",
      null,
      null,
    );

    const res = await request(app).delete(
      `/api/v1/admin/metadata/logs/${log._id}`,
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the user is a general user", async () => {
    const log = await createTestLog(
      testUser._id,
      "SET_COLLECTION_DATES",
      null,
      null,
    );

    const res = await loginAgent.delete(
      `/api/v1/admin/metadata/logs/${log._id}`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if the user is a moderator", async () => {
    const log = await createTestLog(
      testUser._id,
      "SET_COLLECTION_DATES",
      null,
      null,
    );

    const res = await moderatorAgent.delete(
      `/api/v1/admin/metadata/logs/${log._id}`,
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete a log", async () => {
    const log = await createTestLog(
      testUser._id,
      "SET_COLLECTION_DATES",
      null,
      null,
    );

    const res = await adminAgent.delete(
      `/api/v1/admin/metadata/logs/${log._id}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted log");

    const deletedLog = await Log.findById(log._id);
    expect(deletedLog).toBeNull();
  });

  it("should throw an error if the log ID is invalid", async () => {
    const res = await adminAgent.delete(
      "/api/v1/admin/metadata/logs/invalidId",
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: getReports //
describe("GET /api/v1/admin/metadata/reports", () => {
  it("should get all reports", async () => {
    for (let i = 0; i < 5; i++) {
      await createTestReport(testUser._id, "report_banned_word", "pending");
    }

    const res = await adminAgent.get("/api/v1/admin/metadata/reports");

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved reports");
    expect(res.body.reports.length).toBe(5);
    // Check that the reports are returned in the correct order (oldest first)
    for (let i = 0; i < res.body.reports.length - 1; i++) {
      const currentReport = res.body.reports[i];
      const nextReport = res.body.reports[i + 1];
      expect(currentReport.reportType).toBe("report_banned_word");
      expect(nextReport.reportType).toBe("report_banned_word");
      expect(
        new Date(currentReport.createdAt) <= new Date(nextReport.createdAt),
      ).toBe(true);
    }
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).get("/api/v1/admin/metadata/reports");

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the user is a general user", async () => {
    const res = await loginAgent.get("/api/v1/admin/metadata/reports");

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to get reports", async () => {
    const res = await moderatorAgent.get("/api/v1/admin/metadata/reports");

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved reports");
  });

  it("should allow an admin to get reports", async () => {
    const res = await adminAgent.get("/api/v1/admin/metadata/reports");

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Retrieved reports");
  });
});

// Test cases: updateReportStatus //
describe("PATCH /api/v1/admin/metadata/reports/:reportId", () => {
  it("should update the information of a report", async () => {
    const report = await createTestReport(
      testUser._id,
      "report_banned_word",
      "pending",
    );

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/reports/${report._id}`)
      .send({ status: "resolved", resolutionNotes: "Resolved" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated report status");
    expect(res.body.updatedReport.status).toBe("resolved");
    expect(res.body.updatedReport.resolutionNotes).toBe("Resolved");
    expect(res.body.updatedReport.adminId.toString()).toBe(
      adminUser._id.toString(),
    );
  });

  it("should throw an error if the report does not exist", async () => {
    const invalidReportId = new mongoose.Types.ObjectId();

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/reports/${invalidReportId}`)
      .send({
        status: "resolved",
        resolutionNotes: "Resolved",
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("Report not found");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app)
      .patch("/api/v1/admin/metadata/reports/reportId")
      .send({ status: "resolved", resolutionNotes: "Resolved" });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the user is a general user", async () => {
    const res = await loginAgent
      .patch("/api/v1/admin/metadata/reports/reportId")
      .send({ status: "resolved", resolutionNotes: "Resolved" });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow a moderator to update a report", async () => {
    const report = await createTestReport(
      testUser._id,
      "report_banned_word",
      "pending",
    );

    const res = await moderatorAgent
      .patch(`/api/v1/admin/metadata/reports/${report._id}`)
      .send({ status: "resolved", resolutionNotes: "Resolved" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated report status");
  });

  it("should allow an admin to update a report", async () => {
    const report = await createTestReport(
      testUser._id,
      "report_banned_word",
      "pending",
    );

    const res = await adminAgent
      .patch(`/api/v1/admin/metadata/reports/${report._id}`)
      .send({ status: "resolved", resolutionNotes: "Resolved" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Updated report status");
  });

  it("should throw an error if the report ID is invalid", async () => {
    const res = await adminAgent
      .patch("/api/v1/admin/metadata/reports/invalidId")
      .send({ status: "resolved", resolutionNotes: "Resolved" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});

// Test cases: deleteReportById //
describe("DELETE /api/v1/admin/metadata/reports/:reportId", () => {
  it("should delete a report", async () => {
    const report = await createTestReport(
      testUser._id,
      "report_banned_word",
      "pending",
    );

    const res = await adminAgent.delete(
      `/api/v1/admin/metadata/reports/${report._id}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted report");
  });

  it("should silently fail if the report does not exist", async () => {
    const invalidReportId = new mongoose.Types.ObjectId();

    const res = await adminAgent.delete(
      `/api/v1/admin/metadata/reports/${invalidReportId}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted report");
  });

  it("should throw an error if the user is not authenticated", async () => {
    const res = await request(app).delete(
      "/api/v1/admin/metadata/reports/reportId",
    );

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });

  it("should throw an error if the user is a general user", async () => {
    const res = await loginAgent.delete(
      "/api/v1/admin/metadata/reports/reportId",
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should throw an error if the user is a moderator", async () => {
    const res = await moderatorAgent.delete(
      "/api/v1/admin/metadata/reports/reportId",
    );

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe(
      "You do not have permission to perform this action",
    );
  });

  it("should allow an admin to delete a report", async () => {
    const report = await createTestReport(
      testUser._id,
      "report_banned_word",
      "pending",
    );

    const res = await adminAgent.delete(
      `/api/v1/admin/metadata/reports/${report._id}`,
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("Deleted report");
  });

  it("should throw an error if the report ID is invalid", async () => {
    const res = await adminAgent.delete(
      "/api/v1/admin/metadata/reports/invalidId",
    );

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe("Invalid id");
  });
});
