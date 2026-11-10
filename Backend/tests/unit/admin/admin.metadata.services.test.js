import { describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";

import {
  createTestUser,
  createTestBannedWord,
  createTestHoliday,
  getNthWeekdayOfMonth,
  createTestSeason,
  createTestMeasurement,
  createTestReport,
  createTestIngredient,
} from "../../../src/utils/testFunctions.js";

import User from "../../../src/models/user.model.js";
import BannedWord from "../../../src/models/BannedWord.model.js";
import Log from "../../../src/models/log.model.js";
import Holiday from "../../../src/models/holiday.model.js";
import Season from "../../../src/models/season.model.js";
import Measurement from "../../../src/models/measurement.model.js";
import Report from "../../../src/models/report.model.js";
import Ingredient from "../../../src/models/ingredient.model.js";

import {
  addNewBannedWords,
  getAllBannedWords,
  updateBannedWord,
  deleteBannedWord,
  setCollectionDates,
  updateRuleBasedCollectionDates,
  updateAllRuleBasedCollectionDates,
  getUndatedCollections,
  updateIngredientIndex,
  deleteCollectionItemsByTitles,
  addNewMeasurement,
  updateMeasurementUnit,
  getAllReports,
  updateReport,
} from "../../../src/services/admin/admin.metadata.services.js";

// Base test setup //

let testUser;
let testUser2;

// Create a test user and ingredient to be used in the tests
beforeAll(async () => {
  await User.deleteMany({});

  testUser = await createTestUser();
  testUser2 = await createTestUser({
    username: "testuser2",
    slug: "testuser2",
    displayName: "Test User 2",
    email: "testuser2@example.com",
    password: "password123",
  });
});

// Create a fresh test recipe before each test
beforeEach(async () => {
  await BannedWord.deleteMany({});
  await Log.deleteMany({});
  await Holiday.deleteMany({});
  await Season.deleteMany({});
  await Measurement.deleteMany({});
  await Report.deleteMany({});
  await Ingredient.deleteMany({});
});

// Test cases: getAllBannedWords //
describe("getAllBannedWords", () => {
  test("should return an empty array if there are no banned words", async () => {
    const bannedWords = await getAllBannedWords(1, 10, 0);

    expect(bannedWords.bannedWords.length).toBe(0);
    expect(bannedWords.totalBannedWords).toBe(0);
    expect(bannedWords.totalPages).toBe(0);
    expect(bannedWords.currentPage).toBe(1);
  });

  test("should return a banned word with correct information populated", async () => {
    await createTestBannedWord(testUser._id, {
      word: "testbannedword",
      severity: "flag",
      authorId: testUser._id,
    });

    const bannedWords = await getAllBannedWords(1, 10, 0);

    expect(bannedWords.bannedWords.length).toBe(1);
    expect(bannedWords.totalBannedWords).toBe(1);
    expect(bannedWords.totalPages).toBe(1);
    expect(bannedWords.currentPage).toBe(1);
    expect(bannedWords.bannedWords[0].word).toBe("testbannedword");
    expect(bannedWords.bannedWords[0].severity).toBe("flag");
    expect(bannedWords.bannedWords[0].authorId.username).toBe(
      testUser.username,
    );
    expect(bannedWords.bannedWords[0].authorId.profileImage).toBe(
      testUser.profileImage,
    );
  });

  test("should return all banned words with pagination", async () => {
    for (let i = 1; i <= 15; i++) {
      await createTestBannedWord(testUser._id, {
        word: `bannedword${i}`,
        severity: i % 2 === 0 ? "flag" : "block",
        authorId: testUser._id,
      });
    }

    const bannedWords = await getAllBannedWords(1, 10, 0);

    expect(bannedWords.bannedWords.length).toBe(10);
    expect(bannedWords.totalBannedWords).toBe(15);
    expect(bannedWords.totalPages).toBe(2);
    expect(bannedWords.currentPage).toBe(1);
    for (let j = 0; j < bannedWords.bannedWords.length; j++) {
      expect(bannedWords.bannedWords[j].word).toBe(
        `bannedword${bannedWords.totalBannedWords - j}`,
      );
      expect(bannedWords.bannedWords[j].severity).toBe(
        (bannedWords.totalBannedWords - j) % 2 === 0 ? "flag" : "block",
      );
      expect(bannedWords.bannedWords[j].authorId.username).toBe(
        testUser.username,
      );
    }
  });
});

// Test cases: addNewBannedWords //
describe("addNewBannedWords", () => {
  test("should add new banned words and ignore duplicates", async () => {
    const newBannedWords = [
      { word: "TestWord1", severity: "flag" },
      { word: "TestWord2", severity: "block" },
      { word: "TestWord1", severity: "flag" }, // Duplicate
    ];

    const addedBannedWords = await addNewBannedWords(
      newBannedWords,
      testUser._id,
    );

    expect(addedBannedWords.length).toBe(2);
    expect(addedBannedWords[0].word).toBe("testword1");
    expect(addedBannedWords[0].severity).toBe("flag");
    expect(addedBannedWords[0].authorId.toString()).toBe(
      testUser._id.toString(),
    );
    expect(addedBannedWords[1].word).toBe("testword2");
    expect(addedBannedWords[1].severity).toBe("block");
    expect(addedBannedWords[1].authorId.toString()).toBe(
      testUser._id.toString(),
    );
  });

  test("should default severity to 'block' if not provided or invalid", async () => {
    const newBannedWords = [
      { word: "TestWord3" },
      { word: "TestWord4", severity: "invalid" },
    ];

    const addedBannedWords = await addNewBannedWords(
      newBannedWords,
      testUser._id,
    );

    expect(addedBannedWords.length).toBe(2);
    expect(addedBannedWords[0].word).toBe("testword3");
    expect(addedBannedWords[0].severity).toBe("block");
    expect(addedBannedWords[0].authorId.toString()).toBe(
      testUser._id.toString(),
    );
    expect(addedBannedWords[1].word).toBe("testword4");
    expect(addedBannedWords[1].severity).toBe("block");
    expect(addedBannedWords[1].authorId.toString()).toBe(
      testUser._id.toString(),
    );
  });

  test("should avoid adding a duplicate banned word with different severity", async () => {
    const newBannedWords = [
      { word: "TestWord5", severity: "flag" },
      { word: "TestWord5", severity: "block" }, // Duplicate with different severity
    ];

    const addedBannedWords = await addNewBannedWords(
      newBannedWords,
      testUser._id,
    );

    expect(addedBannedWords.length).toBe(1);
    expect(addedBannedWords[0].word).toBe("testword5");
    expect(addedBannedWords[0].severity).toBe("flag");
    expect(addedBannedWords[0].authorId.toString()).toBe(
      testUser._id.toString(),
    );
  });

  test("should avoid adding a duplicate word if it has a different case", async () => {
    await createTestBannedWord(testUser._id, {
      word: "TestWord6",
      severity: "flag",
      authorId: testUser._id,
    });

    const newBannedWords = [
      { word: "TESTWORD6", severity: "block" }, // Duplicate with different case
    ];

    const addedBannedWords = await addNewBannedWords(
      newBannedWords,
      testUser._id,
    );

    expect(addedBannedWords.length).toBe(0);
  });

  test("should avoid adding a duplicate word if it already exists", async () => {
    await createTestBannedWord(testUser._id, {
      word: "TestWord6",
      severity: "flag",
      authorId: testUser._id,
    });

    const newBannedWords = [
      { word: "TestWord6", severity: "block" }, // Duplicate with different severity
    ];

    const addedBannedWords = await addNewBannedWords(
      newBannedWords,
      testUser._id,
    );

    expect(addedBannedWords.length).toBe(0);
  });

  test("should throw an error if newBannedWords is not an array", async () => {
    await expect(
      addNewBannedWords("not an array", testUser._id),
    ).rejects.toThrow("New banned words must be a non-empty array of words");
  });

  test("should throw an error if newBannedWords is an empty array", async () => {
    await expect(addNewBannedWords([], testUser._id)).rejects.toThrow(
      "New banned words must be a non-empty array of words",
    );
  });

  test("should throw an error if any word in newBannedWords is an empty string", async () => {
    await expect(
      addNewBannedWords([{ word: "     " }], testUser._id),
    ).rejects.toThrow(
      "Each banned word must be a non-empty string with a maximum length of 50 characters",
    );
  });

  test("should throw an error if any word in newBannedWords exceeds 50 characters", async () => {
    const longWord = "a".repeat(51);
    await expect(
      addNewBannedWords([{ word: longWord }], testUser._id),
    ).rejects.toThrow(
      "Each banned word must be a non-empty string with a maximum length of 50 characters",
    );
  });
});

// Test cases: updateBannedWord //
describe("updateBannedWord", () => {
  test("should update a banned word's word, severity and authorId", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const updatedBannedWord = await updateBannedWord({
      id: bannedWord._id,
      word: "UpdatedWord",
      severity: "flag",
      authorId: testUser2._id,
    });

    expect(updatedBannedWord.word).toBe("updatedword");
    expect(updatedBannedWord.severity).toBe("flag");
    expect(updatedBannedWord.authorId.toString()).toBe(
      testUser2._id.toString(),
    );
  });

  test("should generate a log when a banned word is updated", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "LogTestWord",
      severity: "block",
      authorId: testUser._id,
    });

    const updatedBannedWord = await updateBannedWord({
      id: bannedWord._id,
      word: "UpdatedLogTestWord",
      severity: "flag",
      authorId: testUser._id,
    });

    // Ensure a log entry was created for the update
    const logEntry = await Log.findOne({ action: "UPDATE_BANNED_WORD" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("UPDATE_BANNED_WORD");
    expect(logEntry.targetId.toString()).toBe(bannedWord._id.toString());
    expect(logEntry.notes)
      .toBe(`Updated banned word from "${bannedWord.word}" with severity "${bannedWord.severity}"
       to "${updatedBannedWord.word}" with severity "${updatedBannedWord.severity}"`);
  });

  test("should throw an error if the banned word to update is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      updateBannedWord({
        id: nonExistentId,
        word: "UpdatedWord",
        severity: "flag",
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Banned word not found");
  });

  test("should throw an error if new word is an empty string", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    await expect(
      updateBannedWord({
        id: bannedWord._id,
        word: "     ",
        severity: "flag",
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "The banned word must be a non-empty string with a maximum length of 50 characters",
    );
  });

  test("should throw an error if new word exceeds 50 characters", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const longWord = "a".repeat(51);

    await expect(
      updateBannedWord({
        id: bannedWord._id,
        word: longWord,
        severity: "flag",
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "The banned word must be a non-empty string with a maximum length of 50 characters",
    );
  });

  test("should throw an error if new severity is invalid", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    await expect(
      updateBannedWord({
        id: bannedWord._id,
        word: "UpdatedWord",
        severity: "invalid",
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "The banned word severity must be either 'flag' or 'block'",
    );
  });

  test("should throw an error if provided reportId is invalid", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    await expect(
      updateBannedWord({
        id: bannedWord._id,
        word: "UpdatedWord",
        severity: "flag",
        reportId: "invalidReportId",
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid reportId format");
  });

  test("should throw an error if provided reportId does not exist", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "OriginalWord",
      severity: "block",
      authorId: testUser._id,
    });

    const nonExistentReportId = new mongoose.Types.ObjectId();

    await expect(
      updateBannedWord({
        id: bannedWord._id,
        word: "UpdatedWord",
        severity: "flag",
        reportId: nonExistentReportId,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Report with the provided reportId not found");
  });
});

// Test cases: deleteBannedWord //
describe("deleteBannedWord", () => {
  test("should delete a banned word", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "WordToDelete",
      severity: "block",
      authorId: testUser._id,
    });

    await deleteBannedWord({ id: bannedWord._id, authorId: testUser._id });

    const deletedBannedWord = await BannedWord.findById(bannedWord._id);
    expect(deletedBannedWord).toBeNull();
  });

  test("should generate a log when a banned word is deleted", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "WordToDeleteWithLog",
      severity: "block",
      authorId: testUser._id,
    });

    await deleteBannedWord({ id: bannedWord._id, authorId: testUser._id });

    // Ensure a log entry was created for the deletion
    const logEntry = await Log.findOne({ action: "DELETE_BANNED_WORD" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("DELETE_BANNED_WORD");
    expect(logEntry.targetId.toString()).toBe(bannedWord._id.toString());
    expect(logEntry.notes).toBe(
      `Deleted banned word "${bannedWord.word}" with severity "${bannedWord.severity}"`,
    );
  });

  test("should throw an error if provided reportId is invalid", async () => {
    const bannedWord = await createTestBannedWord(testUser._id, {
      word: "WordToDelete",
      severity: "block",
      authorId: testUser._id,
    });

    await expect(
      deleteBannedWord({
        id: bannedWord._id,
        reportId: "invalidReportId",
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid reportId format");
  });

  test("should throw an error if the banned word to delete is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      deleteBannedWord({ id: nonExistentId, authorId: testUser._id }),
    ).rejects.toThrow("Banned word not found");
  });
});

// Test cases: setCollectionDates //
describe("setCollectionDates", () => {
  test("should set the start and end date for a fixed date collection", async () => {
    const holiday = await createTestHoliday();

    const updatedHoliday = await setCollectionDates({
      id: holiday._id,
      type: "fixed",
      startDate: "2024/12/24",
      endDate: "2024/12/26",
      collection: Holiday,
      authorId: testUser._id,
    });

    expect(updatedHoliday.startDate.toLocaleDateString()).toBe("12/24/2024");
    expect(updatedHoliday.endDate.toLocaleDateString()).toBe("12/26/2024");

    // Ensure a log entry was created for the date update
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("SET_COLLECTION_DATES");
    expect(logEntry.targetId.toString()).toBe(holiday._id.toString());
    expect(logEntry.notes).toBe(
      `Set fixed dates for Holiday "${updatedHoliday.title}" to startDate: ${updatedHoliday.startDate}, endDate: ${updatedHoliday.endDate}`,
    );
  });

  test("should set the start and end date for a rule based collection", async () => {
    const holiday = await createTestHoliday();

    const today = new Date();
    const month = today.getMonth(); // 0 (January) to 11 (December)
    const weekday = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const week = Math.floor((today.getDate() - 1) / 7) + 1; // 1 to 5

    const updatedHoliday = await setCollectionDates({
      id: holiday._id,
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 3,
      collection: Holiday,
      authorId: testUser._id,
    });

    const expectedStartDate = getNthWeekdayOfMonth(
      today.getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 2);

    // The 4th Tuesday of November 2026 is on the 24th, so with a duration of 3 days, the end date should be the 26th
    expect(updatedHoliday.startDate.toLocaleDateString()).toBe(
      expectedStartDate.toLocaleDateString(),
    );
    expect(updatedHoliday.endDate.toLocaleDateString()).toBe(
      expectedEndDate.toLocaleDateString(),
    );

    // Ensure a log entry was created for the date update
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("SET_COLLECTION_DATES");
    expect(logEntry.targetId.toString()).toBe(holiday._id.toString());
    expect(logEntry.notes).toBe(
      `Set rule-based dates for Holiday "${updatedHoliday.title}" with month: ${month + 1}, weekday: ${weekday}, week: ${week},
         duration: 3 resulting in startDate: ${updatedHoliday.startDate}, endDate: ${updatedHoliday.endDate}`,
    );
  });

  test("should not produce a log entry if it is specified to not generate a log", async () => {
    const holiday = await createTestHoliday();

    const updatedHoliday = await setCollectionDates({
      id: holiday._id,
      type: "fixed",
      startDate: "2024/12/24",
      endDate: "2024/12/26",
      collection: Holiday,
      authorId: testUser._id,
      ignoreLog: true,
    });

    // Ensure no log entry was created for the date update
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).toBeNull();
  });

  test("should throw an error if the collection to update is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      setCollectionDates({
        id: nonExistentId,
        type: "fixed",
        startDate: "2024/12/24",
        endDate: "2024/12/26",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Holiday with the provided id not found");
  });

  test("should throw an error if the provided type is invalid", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "invalid",
        startDate: "2024/12/24",
        endDate: "2024/12/26",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "Invalid type. Type must be either 'fixed' or 'rule-based'",
    );
  });

  test("should throw an error startDate is missing for fixed type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "fixed",
        endDate: "2024/12/26",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For fixed type, both startDate and endDate are required and must be strings",
    );
  });

  test("should throw an error if startDate is not a string for fixed type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "fixed",
        startDate: 20241224,
        endDate: "2024/12/26",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For fixed type, both startDate and endDate are required and must be strings",
    );
  });

  test("should throw an error endDate is missing for fixed type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "fixed",
        startDate: "2024/12/24",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For fixed type, both startDate and endDate are required and must be strings",
    );
  });

  test("should throw an error if endDate is not a string for fixed type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "fixed",
        startDate: "2024/12/24",
        endDate: 20241226,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For fixed type, both startDate and endDate are required and must be strings",
    );
  });

  test("should throw an error if month is missing for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        weekday: 2,
        week: 4,
        duration: 3,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if month is not a number for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: "11",
        weekday: 2,
        week: 4,
        duration: 3,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if weekday is missing for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: 11,
        week: 4,
        duration: 3,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if weekday is not a number for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: 11,
        weekday: "2",
        week: 4,
        duration: 3,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if week is missing for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: 11,
        weekday: 2,
        duration: 3,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if week is not a number for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: 11,
        weekday: 2,
        week: "4",
        duration: 3,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if duration is missing for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: 11,
        weekday: 2,
        week: 4,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });

  test("should throw an error if duration is not a number for rule-based type", async () => {
    const holiday = await createTestHoliday();

    await expect(
      setCollectionDates({
        id: holiday._id,
        type: "rule-based",
        month: 11,
        weekday: 2,
        week: 4,
        duration: "3",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow(
      "For rule-based type, month, weekday, week, and duration are required and must be numbers",
    );
  });
});

// Test cases: updateRuleBasedCollectionDates //
describe("updateRuleBasedCollectionDates", () => {
  test("should update the start and end date for a rule based collection to align with the new year", async () => {
    const holiday = await createTestHoliday({
      title: "Test Rule-Based Holiday",
      type: "rule-based",
      month: 1,
      weekday: 1,
      week: 2,
      duration: 2,
      startDate: "2025/01/08",
      endDate: "2025/01/09",
    });

    const updatedHoliday = await updateRuleBasedCollectionDates({
      id: holiday._id,
      collection: Holiday,
      authorId: testUser._id,
    });

    // The 2nd Monday of January 2026 is on the 12th, so with a duration of 2 days, the end date should be the 13th
    expect(updatedHoliday.startDate.getFullYear()).toBe(
      new Date().getFullYear(),
    );
    expect(updatedHoliday.endDate.getFullYear()).toBe(new Date().getFullYear());

    // Ensure a log entry was created for the date update
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("SET_COLLECTION_DATES");
    expect(logEntry.targetId.toString()).toBe(holiday._id.toString());
    expect(logEntry.notes).toBe(
      `Set rule-based dates for Holiday "${updatedHoliday.title}" with month: ${updatedHoliday.month}, weekday: ${updatedHoliday.weekday}, week: ${updatedHoliday.week},
         duration: ${updatedHoliday.duration} resulting in startDate: ${updatedHoliday.startDate}, endDate: ${updatedHoliday.endDate}`,
    );
  });

  test("should throw an error if the collection to update is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      updateRuleBasedCollectionDates({
        id: nonExistentId,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Rule-based document not found");
  });

  test("should throw an error if the collection to update is not of type rule-based", async () => {
    const holiday = await createTestHoliday({
      title: "Test Fixed Holiday",
      type: "fixed",
      startDate: "2024/12/24",
      endDate: "2024/12/26",
    });

    await expect(
      updateRuleBasedCollectionDates({
        id: holiday._id,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Rule-based document not found");
  });

  test("should not produce a log entry if it is specified to not generate a log", async () => {
    const holiday = await createTestHoliday({
      title: "Test Rule-Based Holiday No Log",
      type: "rule-based",
      month: 1,
      weekday: 1,
      week: 2,
      duration: 2,
      startDate: "2025/01/08",
      endDate: "2025/01/09",
    });

    const updatedHoliday = await updateRuleBasedCollectionDates({
      id: holiday._id,
      collection: Holiday,
      authorId: testUser._id,
      ignoreLog: true,
    });

    // Ensure no log entry was created for the date update
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).toBeNull();
  });

  test("should return null and not generate a log if the end date has not passed", async () => {
    const today = new Date();
    const month = today.getMonth(); // 0 (January) to 11 (December)
    const weekday = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const week = Math.floor((today.getDate() - 1) / 7) + 1; // 1 to 5

    const expectedStartDate = getNthWeekdayOfMonth(
      new Date().getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    const holiday = await createTestHoliday({
      title: "Test Rule-Based Holiday",
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 2,
      startDate: `${expectedStartDate.getFullYear()}/${(
        expectedStartDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedStartDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${expectedEndDate.getFullYear()}/${(
        expectedEndDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedEndDate.getDate().toString().padStart(2, "0")}`,
    });

    const result = await updateRuleBasedCollectionDates({
      id: holiday._id,
      collection: Holiday,
      authorId: testUser._id,
    });

    expect(result).toBeNull();

    // Ensure no log entry was created since the dates should not be updated
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).toBeNull();
  });

  test("should not generate a log if set to ignore logs", async () => {
    const holiday = await createTestHoliday({
      title: "Test Rule-Based Holiday",
      type: "rule-based",
      month: 1,
      weekday: 1,
      week: 2,
      duration: 2,
      startDate: "2025/01/08",
      endDate: "2025/01/09",
    });

    const updatedHoliday = await updateRuleBasedCollectionDates({
      id: holiday._id,
      collection: Holiday,
      authorId: testUser._id,
      ignoreLog: true,
    });

    // Ensure no log entry was created for the date update
    const logEntry = await Log.findOne({ action: "SET_COLLECTION_DATES" });
    expect(logEntry).toBeNull();
  });

  test("should throw an error if the collection to update is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      updateRuleBasedCollectionDates({
        id: nonExistentId,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Rule-based document not found");
  });

  test("should throw an error if the collection to update is not of type rule-based", async () => {
    const holiday = await createTestHoliday({
      title: "Test Fixed Holiday",
      type: "fixed",
      startDate: "2024/12/24",
      endDate: "2024/12/26",
    });

    await expect(
      updateRuleBasedCollectionDates({
        id: holiday._id,
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Rule-based document not found");
  });
});

// Test cases: updateAllRuleBasedCollectionDates //
describe("updateAllRuleBasedCollectionDates", () => {
  test("should update the start and end date for all rule based collections to align with the new year", async () => {
    // Create multiple rule-based holidays and seasons with the same month, weekday, and week from last year to test bulk updating
    const today = new Date();
    const month = today.getMonth(); // 0 (January) to 11 (December)
    const weekday = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const week = Math.floor((today.getDate() - 1) / 7) + 1; // 1 to 5

    const expectedStartDate = getNthWeekdayOfMonth(
      new Date().getFullYear() - 1,
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    const holiday = await createTestHoliday({
      title: "Test Rule-Based Holiday",
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 2,
      startDate: `${expectedStartDate.getFullYear()}/${(
        expectedStartDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedStartDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${expectedEndDate.getFullYear()}/${(
        expectedEndDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedEndDate.getDate().toString().padStart(2, "0")}`,
    });

    const season = await createTestSeason({
      title: "Test Rule-Based Season",
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 2,
      startDate: `${expectedStartDate.getFullYear()}/${(
        expectedStartDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedStartDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${expectedEndDate.getFullYear()}/${(
        expectedEndDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedEndDate.getDate().toString().padStart(2, "0")}`,
    });

    const { updatedHolidays, updatedSeasons } =
      await updateAllRuleBasedCollectionDates(testUser._id);

    expect(updatedHolidays).toHaveLength(1);
    expect(updatedSeasons).toHaveLength(1);

    const updatedHoliday = await Holiday.findById(holiday._id);
    const updatedSeason = await Season.findById(season._id);

    const updatedExpectedStartDate = getNthWeekdayOfMonth(
      new Date().getFullYear(),
      month,
      weekday,
      week,
    );

    const updatedExpectedEndDate = new Date(updatedExpectedStartDate);
    updatedExpectedEndDate.setDate(updatedExpectedStartDate.getDate() + 1);

    expect(updatedHoliday.startDate.toLocaleDateString()).toBe(
      updatedExpectedStartDate.toLocaleDateString(),
    );
    expect(updatedHoliday.endDate.toLocaleDateString()).toBe(
      updatedExpectedEndDate.toLocaleDateString(),
    );
  });

  test("should not update dates for rule based collections whose end date has not passed", async () => {
    const today = new Date();
    const month = today.getMonth(); // 0 (January) to 11 (December)
    const weekday = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const week = Math.floor((today.getDate() - 1) / 7) + 1; // 1 to 5

    const expectedStartDate = getNthWeekdayOfMonth(
      new Date().getFullYear(),
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    const holiday = await createTestHoliday({
      title: "Test Rule-Based Holiday",
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 2,
      startDate: `${expectedStartDate.getFullYear()}/${(
        expectedStartDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedStartDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${expectedEndDate.getFullYear()}/${(
        expectedEndDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedEndDate.getDate().toString().padStart(2, "0")}`,
    });

    const { updatedHolidays, updatedSeasons } =
      await updateAllRuleBasedCollectionDates(testUser._id);

    expect(updatedHolidays).toBeNull();
    expect(updatedSeasons).toBeNull();

    const updatedHoliday = await Holiday.findById(holiday._id);

    expect(updatedHoliday.startDate.toLocaleDateString()).toBe(
      expectedStartDate.toLocaleDateString(),
    );
    expect(updatedHoliday.endDate.toLocaleDateString()).toBe(
      expectedEndDate.toLocaleDateString(),
    );
  });

  test("should only generate one single log entry for multiple updated collections", async () => {
    // Create multiple rule-based holidays with the same month, weekday, and week from last year to test bulk updating and log generation
    const today = new Date();
    const month = today.getMonth(); // 0 (January) to 11 (December)
    const weekday = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const week = Math.floor((today.getDate() - 1) / 7) + 1; // 1 to 5

    const expectedStartDate = getNthWeekdayOfMonth(
      new Date().getFullYear() - 1,
      month,
      weekday,
      week,
    );

    const expectedEndDate = new Date(expectedStartDate);
    expectedEndDate.setDate(expectedStartDate.getDate() + 1);

    const holiday1 = await createTestHoliday({
      title: "Test Rule-Based Holiday 1",
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 2,
      startDate: `${expectedStartDate.getFullYear()}/${(
        expectedStartDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedStartDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${expectedEndDate.getFullYear()}/${(
        expectedEndDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedEndDate.getDate().toString().padStart(2, "0")}`,
    });

    const holiday2 = await createTestHoliday({
      title: "Test Rule-Based Holiday 2",
      type: "rule-based",
      month: month + 1, // month is 1-indexed in the API
      weekday: weekday,
      week: week,
      duration: 2,
      startDate: `${expectedStartDate.getFullYear()}/${(
        expectedStartDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedStartDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${expectedEndDate.getFullYear()}/${(
        expectedEndDate.getMonth() + 1
      )
        .toString()
        .padStart(
          2,
          "0",
        )}/${expectedEndDate.getDate().toString().padStart(2, "0")}`,
    });

    const { updatedHolidays, updatedSeasons } =
      await updateAllRuleBasedCollectionDates(testUser._id);

    expect(updatedHolidays).toHaveLength(2);
    expect(updatedSeasons).toHaveLength(0);

    // Ensure only one log entry was created for the bulk date update
    const logEntries = await Log.find({ action: "SET_COLLECTION_DATES" });
    expect(logEntries).toHaveLength(1);
    const logEntry = logEntries[0];
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("SET_COLLECTION_DATES");
    expect(logEntry.notes).toBe(
      `Updated rule-based collection dates for holidays: ${updatedHolidays
        .map((h) => h.title)
        .join(", ")} and seasons: ${updatedSeasons
        .map((s) => s.title)
        .join(", ")}`,
    );
  });
});

// Test cases: getUndatedCollections //
describe("getUndatedCollections", () => {
  test("should return collections that are missing dates", async () => {
    const holidayWithDates = await createTestHoliday({
      title: "Holiday With Dates",
      type: "fixed",
      startDate: "2024/12/24",
      endDate: "2024/12/26",
    });

    const holidayWithoutDates = await createTestHoliday({
      title: "Holiday Without Dates",
      type: "fixed",
    });

    const seasonWithDates = await createTestSeason({
      title: "Season With Dates",
      type: "fixed",
      startDate: "2024/12/01",
      endDate: "2024/12/31",
    });

    const seasonWithoutDates = await createTestSeason({
      title: "Season Without Dates",
      type: "fixed",
    });

    const { undatedHolidays, undatedSeasons } = await getUndatedCollections();

    expect(undatedHolidays).toHaveLength(1);
    expect(undatedHolidays[0]._id.toString()).toBe(
      holidayWithoutDates._id.toString(),
    );
    expect(undatedSeasons).toHaveLength(1);
    expect(undatedSeasons[0]._id.toString()).toBe(
      seasonWithoutDates._id.toString(),
    );
  });

  test("should return empty arrays if all collections have dates", async () => {
    await createTestHoliday({
      title: "Holiday With Dates",
      type: "fixed",
      startDate: "2024/12/24",
      endDate: "2024/12/26",
    });

    await createTestSeason({
      title: "Season With Dates",
      type: "fixed",
      startDate: "2024/12/01",
      endDate: "2024/12/31",
    });

    const { undatedHolidays, undatedSeasons } = await getUndatedCollections();

    expect(undatedHolidays).toHaveLength(0);
    expect(undatedSeasons).toHaveLength(0);
  });

  test("should return collections that are missing either start or end dates", async () => {
    const holidayWithoutStartDate = await createTestHoliday({
      title: "Holiday Without Start Date",
      type: "fixed",
      endDate: "2024/12/26",
    });

    const holidayWithoutEndDate = await createTestHoliday({
      title: "Holiday Without End Date",
      type: "fixed",
      startDate: "2024/12/24",
    });

    const seasonWithoutStartDate = await createTestSeason({
      title: "Season Without Start Date",
      type: "fixed",
      endDate: "2024/12/31",
    });

    const seasonWithoutEndDate = await createTestSeason({
      title: "Season Without End Date",
      type: "fixed",
      startDate: "2024/12/01",
    });

    const { undatedHolidays, undatedSeasons } = await getUndatedCollections();

    expect(undatedHolidays).toHaveLength(2);
    const undatedHolidayIds = undatedHolidays.map((h) => h._id.toString());
    expect(undatedHolidayIds).toContain(holidayWithoutStartDate._id.toString());
    expect(undatedHolidayIds).toContain(holidayWithoutEndDate._id.toString());

    expect(undatedSeasons).toHaveLength(2);
    const undatedSeasonIds = undatedSeasons.map((s) => s._id.toString());
    expect(undatedSeasonIds).toContain(seasonWithoutStartDate._id.toString());
    expect(undatedSeasonIds).toContain(seasonWithoutEndDate._id.toString());
  });
});

// Test cases: updateIngredientIndex //
describe("updateIngredientIndex", () => {
  test("should update the index of an ingredient in the collection", async () => {
    const ingredient = await createTestIngredient({
      title: "Test Ingredient",
      index: true,
    });

    await updateIngredientIndex(ingredient._id, testUser._id);

    const updatedIngredient = await Ingredient.findById(ingredient._id);

    expect(updatedIngredient.indexItem).toBe(false);

    // Ensure a log entry was created for the index update
    const logEntry = await Log.findOne({ action: "UPDATE_INGREDIENT_INDEX" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("UPDATE_INGREDIENT_INDEX");
    expect(logEntry.targetId.toString()).toBe(ingredient._id.toString());
    expect(logEntry.notes).toBe(
      `Updated indexItem for ${ingredient.title} to ${updatedIngredient.indexItem}`,
    );
  });

  test("should throw an error if the ingredient is not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      updateIngredientIndex(nonExistentId, testUser._id),
    ).rejects.toThrow("Ingredient not found");
  });
});

// Test cases: deleteCollectionItemsByTitles //
describe("deleteCollectionItemsByTitles", () => {
  test("should delete items from the specified collection that match the provided titles", async () => {
    const holidayToDelete1 = await createTestHoliday({
      title: "Holiday To Delete 1",
    });
    const holidayToDelete2 = await createTestHoliday({
      title: "Holiday To Delete 2",
    });
    const holidayToKeep = await createTestHoliday({
      title: "Holiday To Keep",
    });

    await deleteCollectionItemsByTitles({
      titles: ["Holiday To Delete 1", "Holiday To Delete 2"],
      collection: Holiday,
      authorId: testUser._id,
    });

    const deletedHoliday1 = await Holiday.findById(holidayToDelete1._id);
    const deletedHoliday2 = await Holiday.findById(holidayToDelete2._id);
    const keptHoliday = await Holiday.findById(holidayToKeep._id);

    expect(deletedHoliday1).toBeNull();
    expect(deletedHoliday2).toBeNull();
    expect(keptHoliday).not.toBeNull();

    const normalizedTitles = ["Holiday To Delete 1", "Holiday To Delete 2"].map(
      (title) => title.toLowerCase(),
    );

    // Ensure a log entry was created for the bulk deletion
    const logEntry = await Log.findOne({ action: "DELETE_COLLECTION_ITEMS" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("DELETE_COLLECTION_ITEMS");
    expect(logEntry.notes).toBe(
      `Deleted documents from Holiday collection with titles: ${normalizedTitles.join(
        ", ",
      )}`,
    );
  });

  test("should throw an error if titles is not an array", async () => {
    await expect(
      deleteCollectionItemsByTitles({
        titles: "Not an array",
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Holiday titles must be a non-empty array of strings");
  });

  test("should throw an error if titles array is empty", async () => {
    await expect(
      deleteCollectionItemsByTitles({
        titles: [],
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Holiday titles must be a non-empty array of strings");
  });

  test("should throw an error if any title in the array is not a string", async () => {
    await expect(
      deleteCollectionItemsByTitles({
        titles: ["Valid Title", 123],
        collection: Holiday,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Holiday titles must be a non-empty array of strings");
  });
});

// Test cases: addNewMeasurement //
describe("addNewMeasurement", () => {
  test("should add a new measurement to the specified collection item", async () => {
    const newMeasurement = await addNewMeasurement({
      title: "cup",
      system: "us customary",
      baseUnit: "volume",
      toBaseFactor: 0,
      authorId: testUser._id,
    });

    expect(newMeasurement).not.toBeNull();
    expect(newMeasurement.title).toBe("cup");
    expect(newMeasurement.system).toBe("us customary");
    expect(newMeasurement.baseUnit).toBe("volume");
    expect(newMeasurement.toBaseFactor).toBe(0);
  });

  test("should throw an error if title is missing", async () => {
    await expect(
      addNewMeasurement({
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Missing required fields");
  });

  test("should throw an error if system is missing", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Missing required fields");
  });

  test("should throw an error if baseUnit is missing", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Missing required fields");
  });

  test("should throw an error if toBaseFactor is missing", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        baseUnit: "volume",
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Missing required fields");
  });

  test("should throw an error if title is not a string", async () => {
    await expect(
      addNewMeasurement({
        title: 123,
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Title must be a non-empty string");
  });

  test("should throw an error if the title is all whitespace", async () => {
    await expect(
      addNewMeasurement({
        title: "     ",
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Title must be a non-empty string");
  });

  test("should throw an error if system is not a string", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: 123,
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement system");
  });

  test("should throw an error if system is not a valid system choice", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "invalid system",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement system");
  });

  test("should throw an error if base unit is not a string", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        baseUnit: 123,
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement base unit");
  });

  test("should throw an error if base unit is not a valid system choice", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        baseUnit: "invalid base unit",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement base unit");
  });

  test("should throw an error if base factor is not a number", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: "0",
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid toBaseFactor value");
  });

  test("should throw an error if base factor is less that 0", async () => {
    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: -1,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid toBaseFactor value");
  });

  test("should throw an error if the title is not a valid title choice", async () => {
    await expect(
      addNewMeasurement({
        title: "invalid title",
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement unit title");
  });

  test("should throw an error if a measurement already exists", async () => {
    await createTestMeasurement();

    await expect(
      addNewMeasurement({
        title: "cup",
        system: "us customary",
        baseUnit: "volume",
        toBaseFactor: 0,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Measurement unit with this title already exists");
  });
});

// Test cases: getAllReports //
describe("getAllReports", () => {
  test("should return all reports", async () => {
    for (let i = 0; i < 5; i++) {
      await createTestReport(
        testUser._id,
        "report_user",
        "pending",
        testUser2._id,
        "Not resolved yet",
        "User",
      );
    }

    const reports = await getAllReports();

    expect(reports.length).toBe(5);

    for (let i = 0; i < reports.length; i++) {
      expect(reports[i].reportType).toBe("report_user");
      expect(reports[i].reportingUserId._id.toString()).toBe(
        testUser._id.toString(),
      );
      expect(reports[i].reportingUserId.displayName).toBe(testUser.displayName);
      expect(reports[i].targetId._id.toString()).toBe(testUser2._id.toString());
      expect(reports[i].targetId.displayName).toBe(testUser2.displayName);
    }
  });
});

// Test cases: updateMeasurementUnit //
describe("updateMeasurementUnit", () => {
  test("should update an existing measurement unit", async () => {
    const measurement = await createTestMeasurement();

    const measurementBeforeUpdate = await Measurement.findById(measurement._id);

    expect(measurementBeforeUpdate.title).toBe("cup");
    expect(measurementBeforeUpdate.system).toBe("us customary");
    expect(measurementBeforeUpdate.baseUnit).toBe("volume");
    expect(measurementBeforeUpdate.toBaseFactor).toBe(1);

    const updatedMeasurement = await updateMeasurementUnit({
      id: measurement._id,
      title: "cup",
      system: "metric",
      baseUnit: "weight",
      toBaseFactor: 0,
      authorId: testUser._id,
    });

    expect(updatedMeasurement.title).toBe("cup");
    expect(updatedMeasurement.system).toBe("metric");
    expect(updatedMeasurement.baseUnit).toBe("weight");
    expect(updatedMeasurement.toBaseFactor).toBe(0);

    // Ensure a log entry was created
    const logEntry = await Log.findOne({ action: "UPDATE_MEASUREMENT" });
    expect(logEntry).not.toBeNull();
    expect(logEntry.adminId.toString()).toBe(testUser._id.toString());
    expect(logEntry.action).toBe("UPDATE_MEASUREMENT");
    expect(logEntry.targetId.toString()).toBe(measurement._id.toString());
    expect(logEntry.notes).toBe(
      `Updated measurement unit "${measurementBeforeUpdate.title}" with system "${measurementBeforeUpdate.system}", base unit "${measurementBeforeUpdate.baseUnit}", and toBaseFactor ${measurementBeforeUpdate.toBaseFactor}
     to system "${updatedMeasurement.system}", base unit "${updatedMeasurement.baseUnit}", and toBaseFactor ${updatedMeasurement.toBaseFactor}`,
    );
  });

  test("should throw an error if the measurement does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      updateMeasurementUnit({
        id: nonExistentId,
        title: "cup",
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: 1,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Measurement unit not found");
  });

  test("should throw an error if system is not valid", async () => {
    const measurement = await createTestMeasurement();

    await expect(
      updateMeasurementUnit({
        id: measurement._id,
        title: "cup",
        system: "invalid system",
        baseUnit: "weight",
        toBaseFactor: 1,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement system");
  });

  test("should throw an error if base unit is not valid", async () => {
    const measurement = await createTestMeasurement();

    await expect(
      updateMeasurementUnit({
        id: measurement._id,
        title: "cup",
        system: "metric",
        baseUnit: "invalid base unit",
        toBaseFactor: 1,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid measurement base unit");
  });

  test("should throw an error if toBaseFactor is not a number", async () => {
    const measurement = await createTestMeasurement();

    await expect(
      updateMeasurementUnit({
        id: measurement._id,
        title: "cup",
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: "invalid toBaseFactor",
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid toBaseFactor value");
  });

  test("should throw an error if toBaseFactor is less than 0", async () => {
    const measurement = await createTestMeasurement();

    await expect(
      updateMeasurementUnit({
        id: measurement._id,
        title: "cup",
        system: "metric",
        baseUnit: "weight",
        toBaseFactor: -1,
        authorId: testUser._id,
      }),
    ).rejects.toThrow("Invalid toBaseFactor value");
  });
});

// Test cases: updateReport //
describe("updateReport", () => {
  test("should update an existing report", async () => {
    const report = await createTestReport();

    const reportBeforeUpdate = await Report.findById(report._id);

    expect(reportBeforeUpdate.status).toBe("pending");
    expect(reportBeforeUpdate.resolutionNotes).toBe("Pending resolution");
    expect(reportBeforeUpdate.adminId).toBeUndefined();

    const updatedReport = await updateReport({
      id: report._id,
      status: "resolved",
      collectionName: Report,
      targetId: report._id,
      resolutionNotes: "Resolved",
      adminId: testUser._id,
    });

    expect(updatedReport.status).toBe("resolved");
    expect(updatedReport.resolutionNotes).toBe("Resolved");
    expect(updatedReport.adminId.toString()).toBe(testUser._id.toString());
    expect(updatedReport.targetId.toString()).toBe(report._id.toString());
  });

  test("should throw an error if the report does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    await expect(
      updateReport({
        id: nonExistentId,
        status: "resolved",
        collectionName: Report,
        targetId: nonExistentId,
        resolutionNotes: "Resolved",
        adminId: testUser._id,
      }),
    ).rejects.toThrow("Report not found");
  });
});
