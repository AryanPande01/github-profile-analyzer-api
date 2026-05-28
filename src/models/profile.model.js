const { pool } = require("../config/db");

/**
 * Create the profiles table if it doesn't exist
 */
async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS profiles (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      username         VARCHAR(100) NOT NULL UNIQUE,
      github_url       VARCHAR(255),
      avatar_url       VARCHAR(255),
      bio              TEXT,
      location         VARCHAR(255),
      company          VARCHAR(255),
      twitter_username VARCHAR(100),
      hireable         BOOLEAN DEFAULT FALSE,

      -- Counts
      public_repos         INT DEFAULT 0,
      public_gists         INT DEFAULT 0,
      followers            INT DEFAULT 0,
      following            INT DEFAULT 0,

      -- Repo insights
      total_stars          INT DEFAULT 0,
      total_forks          INT DEFAULT 0,
      total_watchers       INT DEFAULT 0,
      avg_stars_per_repo   DECIMAL(10,2) DEFAULT 0,
      most_starred_repo    VARCHAR(255),
      most_starred_repo_stars INT DEFAULT 0,
      recently_active_repos INT DEFAULT 0,
      original_repos       INT DEFAULT 0,
      forked_repos         INT DEFAULT 0,

      -- Language & misc
      top_languages   JSON,
      has_website     BOOLEAN DEFAULT FALSE,
      account_age_days INT DEFAULT 0,

      -- Meta
      analyzed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_username (username),
      INDEX idx_total_stars (total_stars),
      INDEX idx_followers (followers)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.execute(sql);
  console.log("✅ Profiles table ready");
}

/**
 * Upsert a profile (insert or update if username already exists)
 */
async function upsertProfile(data) {
  const sql = `
    INSERT INTO profiles (
      username, github_url, avatar_url, bio, location, company,
      twitter_username, hireable, public_repos, public_gists,
      followers, following, total_stars, total_forks, total_watchers,
      avg_stars_per_repo, most_starred_repo, most_starred_repo_stars,
      recently_active_repos, original_repos, forked_repos,
      top_languages, has_website, account_age_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      github_url             = VALUES(github_url),
      avatar_url             = VALUES(avatar_url),
      bio                    = VALUES(bio),
      location               = VALUES(location),
      company                = VALUES(company),
      twitter_username       = VALUES(twitter_username),
      hireable               = VALUES(hireable),
      public_repos           = VALUES(public_repos),
      public_gists           = VALUES(public_gists),
      followers              = VALUES(followers),
      following              = VALUES(following),
      total_stars            = VALUES(total_stars),
      total_forks            = VALUES(total_forks),
      total_watchers         = VALUES(total_watchers),
      avg_stars_per_repo     = VALUES(avg_stars_per_repo),
      most_starred_repo      = VALUES(most_starred_repo),
      most_starred_repo_stars= VALUES(most_starred_repo_stars),
      recently_active_repos  = VALUES(recently_active_repos),
      original_repos         = VALUES(original_repos),
      forked_repos           = VALUES(forked_repos),
      top_languages          = VALUES(top_languages),
      has_website            = VALUES(has_website),
      account_age_days       = VALUES(account_age_days),
      updated_at             = CURRENT_TIMESTAMP
  `;

  const values = [
    data.username,
    data.github_url,
    data.avatar_url,
    data.bio,
    data.location,
    data.company,
    data.twitter_username,
    data.hireable,
    data.public_repos,
    data.public_gists,
    data.followers,
    data.following,
    data.total_stars,
    data.total_forks,
    data.total_watchers,
    data.avg_stars_per_repo,
    data.most_starred_repo,
    data.most_starred_repo_stars,
    data.recently_active_repos,
    data.original_repos,
    data.forked_repos,
    data.top_languages,
    data.has_website,
    data.account_age_days,
  ];

  const [result] = await pool.execute(sql, values);
  return result;
}

/**
 * Get all stored profiles (with optional pagination & sorting)
 */
async function getAllProfiles({ page = 1, limit = 20, sortBy = "analyzed_at", order = "DESC" } = {}) {
  const allowedSortFields = [
    "username", "followers", "total_stars", "public_repos", "analyzed_at", "updated_at",
  ];
  const allowedOrders = ["ASC", "DESC"];

  const safeSort = allowedSortFields.includes(sortBy) ? sortBy : "analyzed_at";
  const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : "DESC";
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
  `SELECT * FROM profiles ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`,
  [limit, offset]
);

  const [[{ total }]] = await pool.execute("SELECT COUNT(*) as total FROM profiles");

  return { profiles: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get a single profile by username
 */
async function getProfileByUsername(username) {
  const [rows] = await pool.execute("SELECT * FROM profiles WHERE username = ?", [username]);
  return rows[0] || null;
}

/**
 * Delete a profile by username
 */
async function deleteProfile(username) {
  const [result] = await pool.execute("DELETE FROM profiles WHERE username = ?", [username]);
  return result.affectedRows > 0;
}

module.exports = { createTable, upsertProfile, getAllProfiles, getProfileByUsername, deleteProfile };
