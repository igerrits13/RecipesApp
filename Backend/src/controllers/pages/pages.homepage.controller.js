import { getHomepageData } from "../../services/pages/pages.homepage.services.js";

// Create a route for getting the homepage
export async function getHomePage(req, res) {
  try {
    const homepageData = await getHomepageData(req.user);

    res.status(200).json({
      homepageData,
      success: true,
      message: "Homepage retrieved successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
