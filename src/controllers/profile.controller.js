const { fetchUserProfile, fetchUserRepos, computeInsights } = require("../config/github");
const {
  upsertProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
} = require("../models/profile.model");

/**
 * POST /api/profiles/analyze/:username
 * Fetch from GitHub, compute insights, store in DB
 */
async function analyzeProfile(req, res) {
  const { username } = req.params;

  try {
    // Fetch from GitHub
    const [profile, repos] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username),
    ]);

    // Compute insights
    const insights = computeInsights(profile, repos);
    const record = { username: profile.login.toLowerCase(), ...insights };

    // Persist
    await upsertProfile(record);

    // Return stored data
    const stored = await getProfileByUsername(record.username);

    return res.status(200).json({
      success: true,
      message: `Profile for '${username}' analyzed and stored successfully.`,
      data: stored,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ success: false, message: `GitHub user '${username}' not found.` });
    }
    if (err.response?.status === 403) {
      return res.status(429).json({ success: false, message: "GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env to increase limits." });
    }
    console.error("analyzeProfile error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error.", error: err.message });
  }
}

/**
 * GET /api/profiles
 * List all stored profiles with pagination & sorting
 */
async function listProfiles(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const sortBy = req.query.sortBy || "analyzed_at";
  const order = req.query.order || "DESC";

  try {
    const result = await getAllProfiles({ page, limit, sortBy, order });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("listProfiles error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

/**
 * GET /api/profiles/:username
 * Get a single stored profile
 */
async function getProfile(req, res) {
  const { username } = req.params;

  try {
    const profile = await getProfileByUsername(username.toLowerCase());

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' not found. Use POST /api/profiles/analyze/${username} first.`,
      });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("getProfile error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

/**
 * DELETE /api/profiles/:username
 * Remove a profile from the database
 */
async function removeProfile(req, res) {
  const { username } = req.params;

  try {
    const deleted = await deleteProfile(username.toLowerCase());

    if (!deleted) {
      return res.status(404).json({ success: false, message: `Profile '${username}' not found.` });
    }

    return res.status(200).json({ success: true, message: `Profile '${username}' deleted.` });
  } catch (err) {
    console.error("removeProfile error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

module.exports = { analyzeProfile, listProfiles, getProfile, removeProfile };
