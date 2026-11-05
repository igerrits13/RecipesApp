import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

// Verify the user's web token for user authentication
export const protectRoute = async (req, res, next) => {
  try {
    // Get the web token from the request header and verify
    const token = req.cookies["jwt-token"];

    // Verify the provided web token exists and is valid
    if (!token) {
      const err = new Error("No authentication token found, access denied");
      err.statusCode = 401;
      throw err;
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user information excluding password and verify the token matches
    const user = await User.findById(decodedToken.userID).select(
      "+password +role +previousDisplayName +lastDisplayNameChange +previousEmail +lastEmailChange +emailChangeCount +lastPasswordChange +isDeleted",
    );

    if (!user || user.isDeleted) {
      const err = new Error("User does not exist or has been deleted");
      err.statusCode = 401;
      throw err;
    }

    // Check if the email or password was changed after the token was issued
    const tokenIssuedAt = decodedToken.iat * 1000;
    if (
      (user.lastEmailChange &&
        user.lastEmailChange.getTime() > tokenIssuedAt) ||
      (user.lastPasswordChange &&
        user.lastPasswordChange.getTime() > tokenIssuedAt)
    ) {
      const err = new Error(
        "Login information was changed. Please log in again",
      );
      err.statusCode = 401;
      throw err;
    }

    // Return the user and move on to the next method
    req.user = user;
    next();
  } catch (error) {
    const err = new Error(error.message || "Authentication failed");
    err.statusCode = 401;
    next(err);
  }
};

// Verify the user's web token for user authentication, but allow unauthenticated access
export const optionalProtectRoute = async (req, res, next) => {
  try {
    // Get the web token from the request header and verify
    const token = req.cookies["jwt-token"];

    // If no token is provided, allow unauthenticated access
    if (!token) {
      return next();
    }

    // Otherwise, verify the provided web token and authenticate the user
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.userID).select("+isDeleted");

    if (!user || user.isDeleted) {
      const err = new Error("User does not exist or has been deleted");
      err.statusCode = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (error) {
    const err = new Error(error.message || "Authentication failed");
    err.statusCode = 401;
    next(err);
  }
};

// Prevent excessive register attempts from a single IP address
export const registerLimiter =
  process.env.ENABLE_RATE_LIMIT === "true"
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 3,
        // max: process.env.NODE_ENV === "production" ? 3 : 1000,
        message: {
          message: "Too many registration attempts. Please try again later",
        },
        standardHeaders: true,
        legacyHeaders: false,
      })
    : (req, res, next) => next();

// Prevent excessive login attempts from a single IP address
export const loginLimiter =
  process.env.ENABLE_RATE_LIMIT === "true"
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        // max: process.env.NODE_ENV === "production" ? 5 : 1000,
        message: {
          message: "Too many login attempts. Please try again later",
        },
        standardHeaders: true,
        legacyHeaders: false,
      })
    : (req, res, next) => next();

// Verify the user has the required role(s) for accessing a route
export const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!requiredRoles.includes(req.user.role)) {
        const err = new Error(
          "You do not have permission to perform this action",
        );
        err.statusCode = 403;
        throw err;
      }
      next();
    } catch (error) {
      const err = new Error(error.message || "Authorization failed");
      err.statusCode = 403;
      next(err);
    }
  };
};
