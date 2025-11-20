import express from "express";
import Visited from "../models/Visited.js";
import Wishlist from "../models/Wishlist.js";
import UserExperience from "../models/UserExperience.js";

const router = express.Router();

/**
 * Country Insights Routes
 * Provides aggregated data about a specific country from all users
 * Public endpoint - no authentication required
 */

// Get insights for a specific country by code or name
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to match by country code (CCA3) or country name
    const query = {
      $or: [
        { countryCode: identifier.toUpperCase() },
        { countryName: new RegExp(`^${identifier}$`, 'i') }
      ]
    };

    // Get all visited records for this country
    const visited = await Visited.find(query);
    const visitedCount = visited.length;

    // Get all wishlist records for this country
    const wishlisted = await Wishlist.find(query);
    const wishlistCount = wishlisted.length;

    // Get all experiences for this country
    const experienceQuery = {
      country: new RegExp(`^${identifier}$`, 'i')
    };
    const experiences = await UserExperience.find(experienceQuery);
    const experiencesCount = experiences.length;

    // Calculate average rating
    let avgRating = 0;
    if (experiences.length > 0) {
      const totalRating = experiences.reduce((sum, exp) => sum + (exp.rating || 0), 0);
      avgRating = (totalRating / experiences.length).toFixed(1);
    }

    // Get popular themes from experiences
    const themeCount = {};
    experiences.forEach(exp => {
      if (exp.themes && Array.isArray(exp.themes)) {
        exp.themes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      }
    });

    // Get top rated experiences (rating >= 7)
    const topExperiences = experiences
      .filter(exp => exp.rating >= 7)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map(exp => ({
        rating: exp.rating,
        experience: exp.experience,
        themes: exp.themes,
        fromDate: exp.fromDate,
        toDate: exp.toDate
      }));

    // Build response
    const insights = {
      country: visited[0]?.countryName || wishlisted[0]?.countryName || identifier,
      countryCode: visited[0]?.countryCode || wishlisted[0]?.countryCode || identifier,
      totalVisitors: visitedCount,
      totalWishlisted: wishlistCount,
      totalExperiences: experiencesCount,
      averageRating: parseFloat(avgRating),
      popularThemes: themeCount,
      topRatedExperiences: topExperiences,
      communitySize: visitedCount + wishlistCount,
    };

    res.json(insights);
  } catch (error) {
    console.error("Error fetching country insights:", error);
    res.status(500).json({ 
      error: "Failed to fetch country insights",
      details: error.message 
    });
  }
});

// Get popular countries (top 10 most visited)
router.get("/popular/countries", async (req, res) => {
  try {
    const popularVisited = await Visited.aggregate([
      {
        $group: {
          _id: "$countryCode",
          countryName: { $first: "$countryName" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(popularVisited);
  } catch (error) {
    console.error("Error fetching popular countries:", error);
    res.status(500).json({ error: "Failed to fetch popular countries" });
  }
});

// Get trending destinations (most wishlisted)
router.get("/trending/destinations", async (req, res) => {
  try {
    const trending = await Wishlist.aggregate([
      {
        $group: {
          _id: "$countryCode",
          countryName: { $first: "$countryName" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(trending);
  } catch (error) {
    console.error("Error fetching trending destinations:", error);
    res.status(500).json({ error: "Failed to fetch trending destinations" });
  }
});

export default router;