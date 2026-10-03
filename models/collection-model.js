const fs = require('fs');
const path = require('path');

const collectionFile = path.join(__dirname, '..', 'data', 'collection.json');

let entries = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));

function saveEntries() {
    fs.writeFileSync(collectionFile, JSON.stringify(entries, null, 2), 'utf8');
}

function getAll() {
    return entries;
}

function getForUser(userId) {
    return entries.filter(entry => entry.userId === userId);
}

function findEntry(userId, gameId) {
    return entries.find(entry => entry.userId === userId && entry.gameId === gameId);
}

function setEntry(userId, gameId, data) {
    const entry = findEntry(userId, gameId);

    if (entry) {
        if (data.isFavorite !== undefined) {
            entry.isFavorite = data.isFavorite === true;
        }
        if (data.isCompleted !== undefined) {
            entry.isCompleted = data.isCompleted === true;
        }
        saveEntries();
        return true;
    }

    entries.push({
        userId: userId,
        gameId: gameId,
        isFavorite: false,
        isCompleted: false,
        dateAdded: new Date().toISOString().slice(0, 10)
    });
    saveEntries();
    return false;
}

function removeEntry(userId, gameId) {
    const entry = findEntry(userId, gameId);
    if (!entry) {
        return false;
    }
    entries = entries.filter(e => e !== entry);
    saveEntries();
    return true;
}

module.exports = {getAll, getForUser, setEntry, removeEntry};