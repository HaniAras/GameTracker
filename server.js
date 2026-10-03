require('dotenv').config();

const express = require('express');
const session = require('express-session');
const userModel = require('./models/user-model');
const gameModel = require('./models/game-model');
const collectionModel = require('./models/collection-model');

const app = express();

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60
    }
}));

app.use(express.static('public'));

// ---------- Middleware ----------

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.sendStatus(401);
    }
    next();
}

function requireAdmin(req, res, next) {
    if (req.session.user.role !== 'admin') {
        return res.sendStatus(403);
    }
    next();
}

// ---------- RAWG ----------

const RAWG_URL = 'https://api.rawg.io/api/games';

function toGame(rawgGame) {
    return {
        id: rawgGame.id,
        title: rawgGame.name,
        genres: (rawgGame.genres || []).map(genre => genre.name),
        platforms: (rawgGame.platforms || []).map(p => p.platform.name),
        releaseDate: rawgGame.released,
        rating: rawgGame.rating,
        coverImage: rawgGame.background_image
    };
}

async function fetchGameFromRawg(id) {
    const response = await fetch(`${RAWG_URL}/${id}?key=${process.env.RAWG_API_KEY}`);
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error('RAWG ' + response.status);
    }
    return toGame(await response.json());
}

// ---------- Login und Registrierung ----------

app.post('/api/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = userModel.findByUsername(username);

    if (!user || !userModel.checkPassword(user, password)) {
        return res.status(401).json({error: 'Wrong username or password'});
    }

    req.session.user = {id: user.id, username: user.username, role: user.role};
    res.status(200).json(req.session.user);
});

app.post('/api/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({error: 'Please enter a username and a password'});
    }

    if (userModel.findByUsername(username)) {
        return res.status(409).json({error: 'This username is already taken'});
    }

    const user = userModel.createUser(username, password);
    req.session.user = {id: user.id, username: user.username, role: user.role};
    res.status(201).json(req.session.user);
});

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.status(200).json(req.session.user);
    } else {
        res.status(200).json(null);
    }
});

app.post('/api/logout', requireLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.sendStatus(500);
        }
        res.sendStatus(200);
    });
});

// ---------- Feature 1: Suche ----------

app.get('/api/games', async (req, res) => {
    let url = `${RAWG_URL}?key=${process.env.RAWG_API_KEY}&page_size=40`;
    if (req.query.search) {
        url += `&search=${encodeURIComponent(req.query.search)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('RAWG ' + response.status);
        }
        const data = await response.json();
        let games = data.results.map(toGame);

        if (req.query.genre) {
            games = games.filter(game => game.genres.includes(req.query.genre));
        }
        if (req.query.platform) {
            games = games.filter(game => game.platforms.includes(req.query.platform));
        }

        res.status(200).json(games);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(502);
    }
});

app.get('/api/games/:id', async (req, res) => {
    try {
        const game = await fetchGameFromRawg(Number(req.params.id));
        if (!game) {
            return res.sendStatus(404);
        }
        res.status(200).json(game);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(502);
    }
});

// ---------- Feature 2: Sammlung ----------

app.get('/api/collection', requireLogin, (req, res) => {
    const entries = collectionModel.getForUser(req.session.user.id);

    let games = entries.map(entry => {
        const game = gameModel.findById(entry.gameId);
        return {
            id: game.id,
            title: game.title,
            genres: game.genres,
            platforms: game.platforms,
            releaseDate: game.releaseDate,
            rating: game.rating,
            coverImage: game.coverImage,
            isFavorite: entry.isFavorite,
            isCompleted: entry.isCompleted,
            dateAdded: entry.dateAdded
        };
    });

    if (req.query.genre) {
        games = games.filter(game => game.genres.includes(req.query.genre));
    }
    if (req.query.platform) {
        games = games.filter(game => game.platforms.includes(req.query.platform));
    }

    res.status(200).json(games);
});

app.put('/api/collection/:gameId', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const gameId = Number(req.params.gameId);
    const data = req.body || {};

    try {
        if (!gameModel.findById(gameId)) {
            const game = await fetchGameFromRawg(gameId);
            if (!game) {
                return res.sendStatus(404);
            }
            gameModel.saveGame(game);
        }

        const existed = collectionModel.setEntry(userId, gameId, data);
        res.sendStatus(existed ? 200 : 201);
    } catch (err) {
        console.error(err.message);
        res.sendStatus(502);
    }
});

app.delete('/api/collection/:gameId', requireLogin, (req, res) => {
    const removed = collectionModel.removeEntry(req.session.user.id, Number(req.params.gameId));
    res.sendStatus(removed ? 204 : 404);
});

// ---------- Feature 3: Admin-Dashboard ----------

app.get('/api/admin/stats', requireLogin, requireAdmin, (req, res) => {
    const entries = collectionModel.getAll();
    const totalUsers = userModel.countUsers();

    let averageCollectionSize = 0;
    if (totalUsers > 0) {
        averageCollectionSize = Math.round(entries.length / totalUsers * 10) / 10;
    }

    const counts = {};
    for (const entry of entries) {
        counts[entry.gameId] = (counts[entry.gameId] || 0) + 1;
    }

    const mostCollected = Object.keys(counts)
        .map(gameId => ({
            title: gameModel.findById(Number(gameId)).title,
            count: counts[gameId]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    res.status(200).json({
        totalUsers: totalUsers,
        totalEntries: entries.length,
        averageCollectionSize: averageCollectionSize,
        totalFavorites: entries.filter(entry => entry.isFavorite).length,
        totalCompleted: entries.filter(entry => entry.isCompleted).length,
        mostCollected: mostCollected
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});