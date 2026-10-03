const fs = require('fs');
const path = require('path');

const gamesFile = path.join(__dirname, '..', 'data', 'games.json');

const games = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));

function saveGames() {
    fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2), 'utf8');
}

function findById(id) {
    return games.find(game => game.id === id);
}

function saveGame(game) {
    if (!findById(game.id)) {
        games.push(game);
        saveGames();
    }
}

module.exports = {findById, saveGame};