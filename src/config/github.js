const axios = require("axios");
require("dotenv").config();

const githubClient = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
  timeout: 10000,
});

/**
 * Fetch core user profile data
 */
async function fetchUserProfile(username) {
  const { data } = await githubClient.get(`/users/${username}`);
  return data;
}

/**
 * Fetch all public repos (handles pagination)
 */
async function fetchUserRepos(username) {
  const repos = [];
  let page = 1;

  while (true) {
    const { data } = await githubClient.get(`/users/${username}/repos`, {
      params: { per_page: 100, page, sort: "updated" },
    });
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }

  return repos;
}

/**
 * Derive rich insights from raw GitHub data
 */
function computeInsights(profile, repos) {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const totalWatchers = repos.reduce((s, r) => s + r.watchers_count, 0);

  // Language breakdown
  const languageCounts = {};
  repos.forEach((r) => {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
  });
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => ({ lang, count }));

  // Most starred repo
  const mostStarred = repos.reduce(
    (best, r) => (r.stargazers_count > (best?.stargazers_count ?? -1) ? r : best),
    null
  );

  // Activity: repos updated in the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentlyActiveRepos = repos.filter(
    (r) => new Date(r.pushed_at) > sixMonthsAgo
  ).length;

  // Average stars per repo
  const avgStarsPerRepo =
    repos.length > 0 ? (totalStars / repos.length).toFixed(2) : 0;

  // Fork ratio (how many of their repos are forks)
  const forkedRepos = repos.filter((r) => r.fork).length;
  const originalRepos = repos.length - forkedRepos;

  // Has a website / blog
  const hasWebsite = !!profile.blog;

  return {
    public_repos: profile.public_repos,
    public_gists: profile.public_gists,
    followers: profile.followers,
    following: profile.following,
    total_stars: totalStars,
    total_forks: totalForks,
    total_watchers: totalWatchers,
    avg_stars_per_repo: parseFloat(avgStarsPerRepo),
    most_starred_repo: mostStarred?.name || null,
    most_starred_repo_stars: mostStarred?.stargazers_count || 0,
    top_languages: JSON.stringify(topLanguages),
    recently_active_repos: recentlyActiveRepos,
    original_repos: originalRepos,
    forked_repos: forkedRepos,
    has_website: hasWebsite,
    account_age_days: Math.floor(
      (Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)
    ),
    hireable: profile.hireable || false,
    bio: profile.bio || null,
    location: profile.location || null,
    company: profile.company || null,
    twitter_username: profile.twitter_username || null,
    avatar_url: profile.avatar_url || null,
    github_url: profile.html_url,
  };
}

module.exports = { fetchUserProfile, fetchUserRepos, computeInsights };
