import express from "express";
import { getSearchData } from "../../controllers/metadata/metadata.searchData.controller.js";
import { optionalProtectRoute } from "../../middleware/auth.middleware.js";

// Create the router using express
const router = express.Router();

// Create a route for getting all basic search data
router.get("/search-data", optionalProtectRoute, getSearchData);

export default router;
