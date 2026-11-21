import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

import app from "../../src/app.js";

import User from "../../src/models/user.model.js";
import BannedWord from "../../src/models/bannedWord.model.js";
import Report from "../../src/models/report.model.js";

import {
  testUserData,
  unhashedPassword,
  createTestUser,
} from "../../src/utils/testFunctions.js";

// Base test setup //

// Delete all users before each test to ensure a clean slate
beforeEach(async () => {
  await User.deleteMany({});
  await BannedWord.deleteMany({});
  await Report.deleteMany({});
});

// Test cases: registerLimiter //
describe("registerLimiter middleware on register route", () => {
  it("should block registration after 3 attempts from the same IP", async () => {
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: `testuser${i}`,
          displayName: `TestUser${i}`,
          email: `testuser${i}@example.com`,
          password: "TestPassword123!",
        });
    }

    const res = await request(app).post("/api/v1/auth/register").send({
      username: "testuser4",
      displayName: "TestUser4",
      email: "testuser4@example.com",
      password: "TestPassword123!",
    });

    expect(res.statusCode).toEqual(429);
    expect(res.body.message).toBe(
      "Too many registration attempts. Please try again later",
    );
  });

  it("should allow registration after rate limit window has passed", async () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockImplementation(() => now);

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: `testuser${i}`,
          displayName: `TestUser${i}`,
          email: `testuser${i}@example.com`,
          password: "TestPassword123!",
        });
    }

    // Move time forward 16 minutes
    Date.now.mockImplementation(() => now + 16 * 60 * 1000);

    const res = await request(app).post("/api/v1/auth/register").send({
      username: "testuser4",
      displayName: "TestUser4",
      email: "testuser4@example.com",
      password: "TestPassword123!",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Account registered successfully");
    expect(res.body.user.username).toEqual("testuser4");
    expect(res.body.user.email).toEqual("testuser4@example.com");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
  });
});

// Test cases: loginLimiter //
describe("loginLimiter middleware on login route", () => {
  it("should block login after 5 failed attempts from the same IP", async () => {
    await createTestUser(testUserData);

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/v1/auth/login").send({
        login: testUserData.email,
        password: "WrongPassword123",
      });
    }

    const res = await request(app).post("/api/v1/auth/login").send({
      login: testUserData.email,
      password: "WrongPassword123",
    });

    expect(res.statusCode).toEqual(429);
    expect(res.body.message).toBe(
      "Too many login attempts. Please try again later",
    );
  });

  it("should allow login after rate limit window has passed", async () => {
    await createTestUser(testUserData);

    const now = Date.now();
    jest.spyOn(Date, "now").mockImplementation(() => now);

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/v1/auth/login").send({
        login: testUserData.email,
        password: "WrongPassword123",
      });
    }

    // Move time forward 16 minutes
    Date.now.mockImplementation(() => now + 16 * 60 * 1000);

    const res = await request(app).post("/api/v1/auth/login").send({
      login: testUserData.email,
      password: unhashedPassword,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.user.username).toEqual(testUserData.username.toLowerCase());
    expect(res.body.user.email).toEqual(testUserData.email);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
    Date.now.mockRestore();
  });
});
