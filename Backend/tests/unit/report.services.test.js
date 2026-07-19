import mongoose from "mongoose";
import { beforeAll, describe, expect, test } from "@jest/globals";
import User from "../../src/models/user.model.js";
import Report from "../../src/models/report.model.js";

import {
  createTestUser,
  createSecondaryTestUser,
} from "../../src/utils/testFunctions.js";

import { submitReport } from "../../src/services/report.services.js";

// Base test setup //

let testUser;
let otherUser;

// Delete all users and ingredients, and create new test users and ingredients before all tests
beforeAll(async () => {
  await User.deleteMany({});

  testUser = await createTestUser();
  otherUser = await createSecondaryTestUser({
    username: "otheruser",
    displayName: "OtherUser",
    email: `${crypto.randomUUID()}@example.com`,
    password: "Password123",
  });
});

// Delete all recipes and notes before each test
beforeEach(async () => {
  await Report.deleteMany({});
});

// Test cases: submitReport //
describe("submitReport", () => {
  test("should report another user and generate a report", async () => {
    const result = await submitReport({
      id: otherUser._id,
      reportingUserId: testUser._id,
      reportType: "report_user",
      description: "They are spamming me",
      collectionName: User,
    });

    const report = await Report.findOne({ reportType: "report_user" });

    expect(report.reportingUserId.toString()).toBe(testUser._id.toString());
    expect(report.reportType).toBe("report_user");
    expect(report.targetId.toString()).toBe(otherUser._id.toString());
    expect(report.description).toBe("They are spamming me");
    expect(report.collectionName).toBe("User");
  });

  test("should submit feedback and generate a report", async () => {
    const result = await submitReport({
      reportingUserId: testUser._id,
      reportType: "feedback",
      description: "Here is some example feedback",
    });

    const report = await Report.findOne({ reportType: "feedback" });

    expect(report.reportingUserId.toString()).toBe(testUser._id.toString());
    expect(report.reportType).toBe("feedback");
    expect(report.targetId).toBe(null);
    expect(report.description).toBe("Here is some example feedback");
    expect(report.collectionName).toBe(null);
  });

  test("should throw an error if the reported object does not exist", async () => {
    await expect(
      submitReport({
        id: new mongoose.Types.ObjectId(),
        reportingUserId: testUser._id,
        reportType: "report_user",
        description: "They are spamming me",
        collectionName: User,
      }),
    ).rejects.toThrow("User not found");
  });

  test("should throw an error if the report type is not valid", async () => {
    await expect(
      submitReport({
        id: otherUser._id,
        reportingUserId: testUser._id,
        reportType: "invalid_report_type",
        description: "They are spamming me",
        collectionName: User,
      }),
    ).rejects.toThrow("Invalid report type");
  });
});
