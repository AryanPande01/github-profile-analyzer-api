# GitHub Profile Analyzer API

A Node.js + Express backend service that fetches a GitHub user's public profile, computes rich insights, and stores them in a MySQL database.

---

# Live Deployment

Base URL:
https://github-profile-analyzer-api-ggym.onrender.com

## Example Endpoints

### GET All Profiles

https://github-profile-analyzer-api-ggym.onrender.com/api/profiles

### GET Single Profile

https://github-profile-analyzer-api-ggym.onrender.com/api/profiles/torvalds

### POST Analyze Profile

```bash
curl -X POST https://github-profile-analyzer-api-ggym.onrender.com/api/profiles/analyze/torvalds
```

---

# Repository

GitHub Repo:
https://github.com/AryanPande01/github-profile-analyzer-api

---

## Tech Stack

* **Node.js** + **Express.js** — REST API server
* **MySQL** (via `mysql2`) — persistent storage with a connection pool
* **GitHub REST API** — profile & repository data source
* **express-validator** — input validation
* **express-rate-limit** — abuse protection
* **axios** — HTTP client

---

## Deployment

* Backend Hosted on Render
* MySQL Database Hosted on Railway

---

## Project Structure

```text
github-profile-analyzer-api/
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
├── schema.sql
└── README.md
```

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/AryanPande01/github-profile-analyzer-api.git
cd github-profile-analyzer-api
npm install
```

---

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

> Get a GitHub token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (no special scopes needed for public data)

---

### 3. Create MySQL Database

```sql
CREATE DATABASE github_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The `profiles` table is created automatically when the server starts.

---

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

Local:
http://localhost:3000

Production:
https://github-profile-analyzer-api-ggym.onrender.com

---

### `GET /`

Returns service info and available endpoints.

---

### `POST /api/profiles/analyze/:username`

Fetches the GitHub profile for `:username`, computes insights across all public repos, and stores/updates the result in MySQL.

#### Example

```bash
curl -X POST https://github-profile-analyzer-api-ggym.onrender.com/api/profiles/analyze/torvalds
```

#### Example Response

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
    "top_languages": [
      {
        "lang": "C",
        "count": 4
      }
    ],
    "most_starred_repo": "linux"
  }
}
```

---

### `GET /api/profiles`

Returns all stored profiles with pagination and sorting.

| Query Param | Default       | Options                                                                             |
| ----------- | ------------- | ----------------------------------------------------------------------------------- |
| `page`      | `1`           | Any positive integer                                                                |
| `limit`     | `20`          | `1–100`                                                                             |
| `sortBy`    | `analyzed_at` | `username`, `followers`, `total_stars`, `public_repos`, `analyzed_at`, `updated_at` |
| `order`     | `DESC`        | `ASC`, `DESC`                                                                       |

#### Example

```bash
curl "https://github-profile-analyzer-api-ggym.onrender.com/api/profiles?sortBy=total_stars&order=DESC&limit=10"
```

---

### `GET /api/profiles/:username`

Returns stored insights for a single username.

#### Example

```bash
curl https://github-profile-analyzer-api-ggym.onrender.com/api/profiles/torvalds
```

Returns `404` if the profile has not been analyzed yet.

---

### `DELETE /api/profiles/:username`

Removes a stored profile from the database.

#### Example

```bash
curl -X DELETE https://github-profile-analyzer-api-ggym.onrender.com/api/profiles/torvalds
```

---

## Stored Insights

| Field                                            | Description                             |
| ------------------------------------------------ | --------------------------------------- |
| `public_repos`                                   | Total public repositories               |
| `public_gists`                                   | Total public gists                      |
| `followers` / `following`                        | Social graph size                       |
| `total_stars`                                    | Sum of stars across all repositories    |
| `total_forks`                                    | Sum of forks across all repositories    |
| `total_watchers`                                 | Sum of watchers across all repositories |
| `avg_stars_per_repo`                             | Influence metric                        |
| `most_starred_repo`                              | Most popular repository                 |
| `most_starred_repo_stars`                        | Stars on most popular repository        |
| `top_languages`                                  | Top 5 programming languages             |
| `recently_active_repos`                          | Repositories updated in last 6 months   |
| `original_repos`                                 | Non-fork repositories                   |
| `forked_repos`                                   | Forked repositories                     |
| `account_age_days`                               | GitHub account age                      |
| `has_website`                                    | Whether user has linked website         |
| `hireable`                                       | GitHub hireable flag                    |
| `bio`, `location`, `company`, `twitter_username` | Additional metadata                     |

---

## Error Handling

| HTTP Code | Cause                                        |
| --------- | -------------------------------------------- |
| `400`     | Invalid username format                      |
| `404`     | GitHub user not found / profile not analyzed |
| `429`     | GitHub API rate limit exceeded               |
| `500`     | Internal server error                        |

---

## Rate Limiting

The API enforces **100 requests per 15 minutes per IP** by default to prevent abuse.
