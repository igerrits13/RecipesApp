import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";

import User from "../../src/models/user.model.js";
import BannedWord from "../../src/models/bannedWord.model.js";
import Report from "../../src/models/report.model.js";

import {
  testUserData,
  unhashedPassword,
  createTestUser,
  createTestBannedWord,
} from "../../src/utils/testFunctions.js";

// Base test setup //

// Delete all users before each test to ensure a clean slate
beforeEach(async () => {
  await User.deleteMany({});
  await BannedWord.deleteMany({});
  await Report.deleteMany({});
});

// Test cases: register //
describe("POST /api/v1/auth/register", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(testUserData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Account registered successfully");
    expect(res.body.user.username).toEqual(testUserData.username.toLowerCase());
    expect(res.body.user.email).toEqual(testUserData.email);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
    expect(res.body.user).toHaveProperty("email", testUserData.email);
    expect(res.body.user).toHaveProperty("profileImage");
    expect(res.body.user).toHaveProperty("favoriteRecipes");
    expect(res.body.user).toHaveProperty("favoriteCuisines");
    expect(res.body.user).toHaveProperty("allergies");
    expect(res.body.user).toHaveProperty("shoppingList");
    expect(res.body.user).toHaveProperty("preferences");
    expect(res.body.user).toHaveProperty("lastLogin");
    expect(res.body.user).toHaveProperty("createdAt");
    expect(res.body.user).toHaveProperty("updatedAt");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("role");
    expect(res.body.user).not.toHaveProperty("previousDisplayName");
    expect(res.body.user).not.toHaveProperty("lastDisplayNameChange");
    expect(res.body.user).not.toHaveProperty("previousEmail");
    expect(res.body.user).not.toHaveProperty("lastEmailChange");
    expect(res.body.user).not.toHaveProperty("lastPasswordChange");
    expect(res.body.user).not.toHaveProperty("lastFailedLogin");
    expect(res.body.user).not.toHaveProperty("failedLoginAttempts");
    expect(res.body.user).not.toHaveProperty("isEmailVerified");
    expect(res.body.user).not.toHaveProperty("isBanned");
    expect(res.body.user).not.toHaveProperty("isDeleted");
    expect(res.body.user).not.toHaveProperty("deletedAt");
  });

  // Test passes, disabled due to rate limiting constraints
  // it("should not register with missing fields", async () => {
  //   const res = await request(app).post("/api/v1/auth/register").send({});

  //   expect(res.statusCode).toEqual(400);
  //   expect(res.body.success).toBe(false);
  //   expect(res.body.message).toBe("All fields required");
  // });
});

// Test cases: checkBannedWord //
describe("checkBannedWord middleware on register route", () => {
  it("should not register with a blocked banned word as a displayname", async () => {
    const testUser = await createTestUser(testUserData);
    const testBannedWord = await createTestBannedWord(testUser._id);

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...testUserData, displayName: testBannedWord.word });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      `Content contains banned word: ${testBannedWord.word}`,
    );
  });

  it("should register a user with a blocked banned word that is part of a displayname", async () => {
    const testUser = await createTestUser(testUserData);
    const testBannedWord = await createTestBannedWord(testUser._id);

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "testuser@email.com",
        password: "Testpassword123!",
        username: "testuser2",
        displayName: `${testBannedWord.word}test`,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Account registered successfully");
    expect(res.body.user.displayName).toBe(`${testBannedWord.word}test`);
  });

  it("should allow registrion for a displayname with a flag banned word and not create a report", async () => {
    const testUser = await createTestUser(testUserData);
    const testBannedWord = await createTestBannedWord(testUser._id, {
      severity: "flag",
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      email: "testuser@email.com",
      password: "Testpassword123!",
      username: "testuser2",
      displayName: testBannedWord.word,
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Account registered successfully");
    expect(res.body.user.displayName).toBe(testBannedWord.word);

    const report = await Report.findOne({
      reportType: "report_banned_word",
    });

    expect(report).toBeNull();
  });
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

// Test cases: login //
describe("POST /api/v1/auth/login", () => {
  it("should login successfully with correct email credentials", async () => {
    await createTestUser(testUserData);

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
    expect(res.body.user).toHaveProperty("profileImage");
    expect(res.body.user).toHaveProperty("favoriteRecipes");
    expect(res.body.user).toHaveProperty("favoriteCuisines");
    expect(res.body.user).toHaveProperty("allergies");
    expect(res.body.user).toHaveProperty("shoppingList");
    expect(res.body.user).toHaveProperty("preferences");
    expect(res.body.user).toHaveProperty("lastLogin");
    expect(res.body.user).toHaveProperty("createdAt");
    expect(res.body.user).toHaveProperty("updatedAt");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("role");
    expect(res.body.user).not.toHaveProperty("previousDisplayName");
    expect(res.body.user).not.toHaveProperty("lastDisplayNameChange");
    expect(res.body.user).not.toHaveProperty("previousEmail");
    expect(res.body.user).not.toHaveProperty("lastEmailChange");
    expect(res.body.user).not.toHaveProperty("lastPasswordChange");
    expect(res.body.user).not.toHaveProperty("lastFailedLogin");
    expect(res.body.user).not.toHaveProperty("failedLoginAttempts");
    expect(res.body.user).not.toHaveProperty("isEmailVerified");
    expect(res.body.user).not.toHaveProperty("isBanned");
    expect(res.body.user).not.toHaveProperty("isDeleted");
    expect(res.body.user).not.toHaveProperty("deletedAt");
  });

  it("should login successfully with correct username credentials", async () => {
    await createTestUser(testUserData);

    const res = await request(app).post("/api/v1/auth/login").send({
      login: testUserData.username,
      password: unhashedPassword,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.user.username).toEqual(testUserData.username.toLowerCase());
    expect(res.body.user.email).toEqual(testUserData.email);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
  });

  it("should not login with incorrect password", async () => {
    await createTestUser(testUserData);

    const res = await request(app).post("/api/v1/auth/login").send({
      login: testUserData.email,
      password: "WrongPassword123",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid login information");
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

// Test cases: logout //
describe("POST /api/v1/auth/logout", () => {
  it("should logout successfully", async () => {
    await createTestUser(testUserData);

    const res = await request(app).post("/api/v1/auth/logout").send();

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logout successful");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=;/);
  });
});

// Test cases: authCheck //
describe("GET /api/v1/auth/authCheck", () => {
  it("should confirm authentication status for authenticated user", async () => {
    const user = await createTestUser(testUserData);

    const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/v1/auth/authCheck")
      .set("Cookie", `jwt-token=${token}`)
      .send();

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Authenticated");
    expect(res.body.user.username).toEqual(testUserData.username.toLowerCase());
    expect(res.body.user.email).toEqual(testUserData.email);
  });

  it("should return 401 for unauthenticated user", async () => {
    const res = await request(app).get("/api/v1/auth/authCheck").send();

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "No authentication token found, access denied",
    );
  });
});
