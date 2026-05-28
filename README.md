# GitHub Profile Analyzer API

A Node.js + Express backend service that fetches a GitHub user's public profile, computes rich insights, and stores them in a MySQL database.

---

## Tech Stack
- **Node.js** + **Express.js** — REST API server
- **MySQL** (via `mysql2`) — persistent storage with a connection pool
- **GitHub REST API** — profile & repository data source
- **express-validator** — input validation
- **express-rate-limit** — abuse protection
- **axios** — HTTP client

---

## Project Structure

```
github-profile-analyzer/
├── src/
│   ├── index.js                    # App entry point
│   ├── config/
│   │   ├── db.js                   # MySQL pool + connection test
│   │   └── github.js               # GitHub API client + insight computation
│   ├── models/
│   │   └── profile.model.js        # Table creation + DB queries
│   ├── controllers/
│   │   └── profile.controller.js   # Business logic for each route
│   ├── routes/
│   │   └── profile.routes.js       # Route definitions + validation rules
│   └── middleware/
│       └── validate.js             # express-validator error handler
├── .env.example
├── package.json
└── README.md
```

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/AryanPande01/github-profile-analyzer-api.git
cd github-profile-analyzer
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional but highly recommended — raises GitHub API rate limit from 60 → 5000 req/hr
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

> **Get a GitHub token**: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (no special scopes needed for public data)

### 3. Create MySQL Database

```sql
CREATE DATABASE github_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The `profiles` table is created **automatically** when the server starts.

### 4. Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## API Reference

### Base URL
`http://localhost:3000`

---

### `GET /`
Returns service info and available endpoints.

---

### `POST /api/profiles/analyze/:username`

Fetches the GitHub profile for `:username`, computes insights across all public repos, and stores/updates the result in MySQL.

**Example:**
```bash
curl -X POST http://localhost:3000/api/profiles/analyze/torvalds
```

**Response:**
```json
{
  "success": true,
  "message": "Profile for 'torvalds' analyzed and stored successfully.",
  "data": {
    "id": 1,
    "username": "torvalds",
    "followers": 230000,
    "public_repos": 7,
    "total_stars": 210000,
    "top_languages": [{"lang": "C", "count": 4}],
    "most_starred_repo": "linux",
    ...
  }
}
```

---

### `GET /api/profiles`

Returns all stored profiles with pagination and sorting.

| Query Param | Default       | Options                                                    |
|-------------|---------------|------------------------------------------------------------|
| `page`      | `1`           | Any positive integer                                       |
| `limit`     | `20`          | 1–100                                                      |
| `sortBy`    | `analyzed_at` | `username`, `followers`, `total_stars`, `public_repos`, `analyzed_at`, `updated_at` |
| `order`     | `DESC`        | `ASC`, `DESC`                                              |

**Example:**
```bash
curl "http://localhost:3000/api/profiles?sortBy=total_stars&order=DESC&limit=10"
```

---

### `GET /api/profiles/:username`

Returns the stored insights for a single username.

```bash
curl http://localhost:3000/api/profiles/torvalds
```

Returns `404` if the profile hasn't been analyzed yet, with a helpful message pointing to the analyze endpoint.

---

### `DELETE /api/profiles/:username`

Removes a stored profile from the database.

```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

## Stored Insights

| Field | Description |
|-------|-------------|
| `public_repos` | Total public repositories |
| `public_gists` | Total public gists |
| `followers` / `following` | Social graph size |
| `total_stars` | Sum of ⭐ across all repos |
| `total_forks` | Sum of forks across all repos |
| `total_watchers` | Sum of watchers across all repos |
| `avg_stars_per_repo` | Influence metric |
| `most_starred_repo` | Name of their most popular repo |
| `most_starred_repo_stars` | Star count of most popular repo |
| `top_languages` | Top 5 programming languages (JSON array) |
| `recently_active_repos` | Repos with commits in the last 6 months |
| `original_repos` | Repos they created (not forks) |
| `forked_repos` | Repos that are forks |
| `account_age_days` | Days since GitHub account creation |
| `has_website` | Whether they have a blog/website linked |
| `hireable` | Their hireable flag |
| `bio`, `location`, `company`, `twitter_username` | Profile metadata |

---

## Error Handling

| HTTP Code | Cause |
|-----------|-------|
| `400` | Invalid username format |
| `404` | GitHub user not found / profile not yet analyzed |
| `429` | GitHub API rate limit hit (add `GITHUB_TOKEN` to fix) |
| `500` | Internal server error |

---

## Rate Limiting

The API enforces **100 requests per 15 minutes** per IP by default to prevent abuse.
