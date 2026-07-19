import express from "express";
import { optionalProtectRoute } from "../../middleware/auth.middleware.js";
import { getHomePage } from "../../controllers/pages/pages.homepage.controller.js";

// Create the router using express
const router = express.Router();

// Create a route for getting the homepage
router.get("/", optionalProtectRoute, getHomePage);

export default router;
