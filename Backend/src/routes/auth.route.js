import express from "express";
import {
  loginLimiter,
  protectRoute,
  registerLimiter,
} from "../middleware/auth.middleware.js";
import {
  authCheck,
  logout,
  register,
  login,
} from "../controllers/auth.controller.js";
import { checkBannedWord } from "../middleware/bannedWord.middleware.js";

// Create the router using express
const router = express.Router();

// Create a route for registering a new account
router.post(
  "/register",
  checkBannedWord(["displayName"], true, null, null, "users"),
  registerLimiter,
  register,
);

// Create a route for logging into an existing account
router.post("/login", loginLimiter, login);

// Create a route for logging out of an account
router.post("/logout", logout);

// Create a route for checking authentication status
router.get("/authCheck", protectRoute, authCheck);

export default router;
