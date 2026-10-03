# GameTracker

GameTracker is a web application for discovering video games via the RAWG Video Games Database API and managing a personal game collection.

- **Guests** can browse and search games by title, genre and platform.
- **Users** can sign up or log in, add games to their collection, mark them as favorite or completed, remove them and filter the collection by genre and platform.
- **Admins** can also open a dashboard with statistics across all users (registered users, games in all collections, average collection size, favorites, completed games, most collected games).

## Tech Stack

- Node.js 24 (LTS) with Express 5.2 (server and REST API)
- express-session 1.19 (login sessions)
- bcryptjs 3.0 (passwords are stored hashed, never in plain text)
- dotenv 18.0 (the RAWG API key and the session secret are stored in `.env`, not in the code)
- HTML, CSS and JavaScript with `fetch` (frontend, without frameworks)
- JSON files (data storage)

All packages are listed in `package.json` and installed with `npm install`. No build step is needed.

## Setup and Start

1. Install Node.js 24 (LTS) or newer.
2. Clone the repository and install the dependencies:
```
   git clone https://github.com/HaniAras/GameTracker.git
   cd GameTracker
   npm install
```
3. Get a free API key from the RAWG Video Games Database: https://rawg.io/apidocs
4. Create a file `.env` in the project folder (see `.env.example`):
```
   RAWG_API_KEY=your_rawg_api_key
   SESSION_SECRET=any_long_random_text
```
5. Start the server:
```
   node server.js
```
6. Open http://localhost:3000 in the browser.

The server also delivers the frontend, so only one start command is needed.

## Test Accounts

These accounts are for testing only. New users can be created with "Sign up". Admin accounts cannot be created via sign-up.

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | admin |
| hani     | hani123  | user  |
| crisi    | crisi123 | user  |

## Resource Model

Based on the concept feedback, the resource model was revised:

1. `Game` now has an `id` (the RAWG game ID).
2. User-specific data was moved from `Game` into a separate resource `CollectionEntry`.
3. `genres` and `platforms` are arrays, because a game can have several of each.

| Resource | File | Properties |
|----------|------|------------|
| Game | `data/games.json` | `id` (Number), `title` (String), `genres` (String[]), `platforms` (String[]), `releaseDate` (Date), `rating` (Number), `coverImage` (String) |
| CollectionEntry | `data/collection.json` | `userId` (Number), `gameId` (Number), `isFavorite` (Boolean), `isCompleted` (Boolean), `dateAdded` (Date) |
| User | `data/users.json` | `id` (Number), `username` (String), `passwordHash` (String), `role` (String), `createdAt` (Date) |

A game in a user's collection combines `Game` and `CollectionEntry` and therefore has ten properties, including String, Number, Boolean and Date. Dates are stored as ISO strings, because JSON has no date type.

JSON files are used instead of SQLite, because this is a small prototype. Only the modules in `models/` read and write the files, so SQLite could be added later without changing the routes.

## REST API

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/games?search=&genre=&platform=` | everyone |
| GET | `/api/games/:id` | everyone |
| POST | `/api/register` | everyone |
| POST | `/api/login` | everyone |
| POST | `/api/logout` | logged in |
| GET | `/api/session` | everyone |
| GET | `/api/collection?genre=&platform=` | user |
| PUT | `/api/collection/:gameId` | user |
| DELETE | `/api/collection/:gameId` | user |
| GET | `/api/admin/stats` | admin |

Requests without login get `401 Unauthorized`, logged-in users without admin role get `403 Forbidden` on admin routes.