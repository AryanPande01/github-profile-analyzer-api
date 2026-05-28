const express = require("express");
const { param, query } = require("express-validator");
const { analyzeProfile, listProfiles, getProfile, removeProfile } = require("../controllers/profile.controller");
const validate = require("../middleware/validate");

const router = express.Router();

// Username validation rule
const usernameParam = param("username")
  .trim()
  .notEmpty()
  .withMessage("Username is required")
  .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/)
  .withMessage("Invalid GitHub username format");

/**
 * @route   POST /api/profiles/analyze/:username
 * @desc    Fetch GitHub profile, compute insights, store in DB
 */
router.post("/analyze/:username", [usernameParam], validate, analyzeProfile);

/**
 * @route   GET /api/profiles
 * @desc    List all stored profiles (paginated, sortable)
 * @query   page, limit, sortBy, order
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1–100"),
    query("sortBy")
      .optional()
      .isIn(["username", "followers", "total_stars", "public_repos", "analyzed_at", "updated_at"])
      .withMessage("Invalid sortBy field"),
    query("order").optional().isIn(["ASC", "DESC"]).withMessage("order must be ASC or DESC"),
  ],
  validate,
  listProfiles
);

/**
 * @route   GET /api/profiles/:username
 * @desc    Get a single stored profile by username
 */
router.get("/:username", [usernameParam], validate, getProfile);

/**
 * @route   DELETE /api/profiles/:username
 * @desc    Delete a stored profile
 */
router.delete("/:username", [usernameParam], validate, removeProfile);

module.exports = router;
