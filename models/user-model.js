const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

function findByUsername(username) {
    return users.find(user => user.username === username);
}

function checkPassword(user, password) {
    return bcrypt.compareSync(password, user.passwordHash);
}

function createUser(username, password) {
    const user = {
        id: users.length + 1,
        username: username,
        passwordHash: bcrypt.hashSync(password, 10),
        role: 'user',
        createdAt: new Date().toISOString().slice(0, 10)
    };
    users.push(user);
    saveUsers();
    return user;
}

function countUsers() {
    return users.length;
}

module.exports = {findByUsername, checkPassword, createUser, countUsers};