# GameTracker

GameTracker is a web application for searching video games with the RAWG Video Games Database API and managing a personal game collection. Users can mark games as favorites or as completed and filter their collection. Admins get a dashboard with statistics.

## Roles

- **Guest** (not logged in): search and browse games, view game details
- **User** (logged in): everything a guest can do, plus managing a personal collection
- **Admin**: everything a user can do, plus access to the admin dashboard

Guests do not need an account. Everyone who is not logged in is a guest.

## Tech Stack

- Node.js + Express (server and REST API)
- express-session (login sessions)
- bcryptjs (passwords are stored hashed, never in plain text)
- dotenv (the RAWG API key and the session secret are stored in `.env`, not in the code)
- HTML, CSS and JavaScript with `fetch` (frontend, without frameworks)
- JSON files (data storage)

## Revised Resource Model

Based on the feedback on my concept, I changed the resource model in three ways:

1. `Game` now has an `id`. I use the ID that RAWG gives each game.
2. Data that belongs to a user (`isFavorite`, `isCompleted`, `dateAdded`) is no longer stored in `Game`. It is now stored in a separate resource called `CollectionEntry`.
3. `genre` and `platform` are now the arrays `genres` and `platforms`, because a game can have more than one.

### Game (`data/games.json`)

General game data from RAWG. Each game is stored only once and is shared by all users.

| Property    | Type          | Description                                   |
|-------------|---------------|-----------------------------------------------|
| id          | Number        | RAWG game ID, unique                          |
| title       | String        | Game title                                    |
| genres      | Array<String> | All genres, e.g. `["Action", "RPG"]`          |
| platforms   | Array<String> | All platforms, e.g. `["PC", "PlayStation 5"]` |
| releaseDate | String        | Release date, e.g. `"2013-09-17"`             |
| rating      | Number        | RAWG rating from 0 to 5                       |
| coverImage  | String        | Link (URL) to the cover image                 |

### CollectionEntry (`data/collection.json`)

Connects a user with a game. It stores what this user marked for this game.

| Property    | Type    | Description                              |
|-------------|---------|------------------------------------------|
| userId      | Number  | The `id` of the user                     |
| gameId      | Number  | The `id` of the game                     |
| isFavorite  | Boolean | Marked as favorite                       |
| isCompleted | Boolean | Marked as completed                      |
| dateAdded   | String  | When the game was added, e.g. `"2026-10-02"` |

Each user can add a game only once. So there is never more than one entry with the same `userId` and `gameId`.

### User (`data/users.json`)

| Property     | Type   | Description                              |
|--------------|--------|------------------------------------------|
| id           | Number | Unique number of the user                |
| username     | String | Username, no two users can have the same |
| passwordHash | String | Password hashed with bcryptjs            |
| role         | String | `"user"` or `"admin"`                    |
| createdAt    | String | Registration date, e.g. `"2026-10-02"`   |

## Data Storage: JSON instead of SQLite

The feedback recommended SQLite, but also said that JSON files are fine for a small prototype. I decided to keep JSON files, because GameTracker is a small course project with only a few users and little data.

To make the JSON storage as clean as possible:

- The data is split into three files: `games.json`, `collection.json` and `users.json`. This way, statistics like "most collected games" can be calculated from one file (`collection.json`).
- Only the model files can open and change the JSON files. `server.js` never accesses them directly. If the project switched to SQLite later, only the model files would need to change.

## REST API

| Method | Path                      | Who can use it | Description                                        | Status codes  |
|--------|---------------------------|----------------|----------------------------------------------------|---------------|
| GET    | `/api/games`              | everyone       | Search games (`?search=`, `?genre=`, `?platform=`) | 200           |
| GET    | `/api/games/:id`          | everyone       | Details of one game                                | 200, 404      |
| POST   | `/api/register`           | everyone       | Create a user account                              | 201, 400, 409 |
| POST   | `/api/login`              | everyone       | Log in                                             | 200, 401      |
| POST   | `/api/logout`             | logged in      | Log out                                            | 200           |
| GET    | `/api/session`            | everyone       | Shows if someone is logged in and with which role  | 200           |
| GET    | `/api/collection`         | user           | Own collection (`?genre=` filter)                  | 200, 401      |
| PUT    | `/api/collection/:gameId` | user           | Add a game or change favorite/completed            | 201, 200, 401 |
| DELETE | `/api/collection/:gameId` | user           | Remove a game from the collection                  | 204, 401, 404 |
| GET    | `/api/admin/stats`        | admin          | Statistics for the admin dashboard                 | 200, 401, 403 |

`401 Unauthorized` means that nobody is logged in. `403 Forbidden` means that someone is logged in, but is not an admin.

## Setup

1. Install the packages:
   ```
   npm install
   ```
2. Create a `.env` file in the project folder:
   ```
   RAWG_API_KEY=your_rawg_api_key
   SESSION_SECRET=any_long_random_text
   ```
3. Start the server:
   ```
   node server.js
   ```
4. Open `http://localhost:3000` in the browser.
