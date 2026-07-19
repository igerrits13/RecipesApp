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
    if (!token)
      return res.status(401).json({
        success: false,
        message: "No authentication token found, access denied",
      });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user information excluding password and verify the token matches
    const user = await User.findById(decodedToken.userID).select(
      "+password +role +previousDisplayName +lastDisplayNameChange +previousEmail +lastEmailChange +emailChangeCount +lastPasswordChange +isDeleted",
    );

    if (!user || user.isDeleted)
      return res.status(401).json({
        success: false,
        message: "Web token is not valid, access denied",
      });

    // Check if the email or password was changed after the token was issued
    const tokenIssuedAt = decodedToken.iat * 1000;
    if (
      (user.lastEmailChange &&
        user.lastEmailChange.getTime() > tokenIssuedAt) ||
      (user.lastPasswordChange &&
        user.lastPasswordChange.getTime() > tokenIssuedAt)
    ) {
      return res.status(401).json({
        success: false,
        message: "Login information was changed. Please log in again",
      });
    }

    // Return the user and move on to the next method
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
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
      return res.status(401).json({
        success: false,
        message: "Web token is not valid, access denied",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Web token is not valid, access denied",
    });
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
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
