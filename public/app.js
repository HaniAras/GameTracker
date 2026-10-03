const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchGenre = document.getElementById('search-genre');
const searchPlatform = document.getElementById('search-platform');
const searchMessage = document.getElementById('search-message');
const searchResults = document.getElementById('search-results');

const loginDialog = document.getElementById('login-dialog');
const registerDialog = document.getElementById('register-dialog');

const userInfo = document.getElementById('user-info');
const collectionLink = document.getElementById('collection-link');
const adminLink = document.getElementById('admin-link');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const logoutButton = document.getElementById('logout-button');

let currentUser = null;

// ---------- Spielkarten ----------

function createGameCard(game) {
    const card = document.createElement('li');
    card.className = 'game-card';

    if (game.coverImage) {
        const image = document.createElement('img');
        image.src = game.coverImage;
        image.alt = 'Cover of ' + game.title;
        card.appendChild(image);
    }

    const title = document.createElement('h3');
    title.textContent = game.title;
    card.appendChild(title);

    const details = document.createElement('p');
    details.textContent =
        'Genres: ' + (game.genres.join(', ') || 'unknown') +
        ' | Platforms: ' + (game.platforms.join(', ') || 'unknown') +
        ' | Released: ' + (game.releaseDate || 'unknown') +
        ' | Rating: ' + game.rating;
    card.appendChild(details);

    return card;
}

// ---------- Feature 1: Suche ----------

async function loadGames() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) {
        params.append('search', searchInput.value.trim());
    }
    if (searchGenre.value) {
        params.append('genre', searchGenre.value);
    }
    if (searchPlatform.value) {
        params.append('platform', searchPlatform.value);
    }

    searchMessage.textContent = 'Loading games …';
    searchResults.innerHTML = '';

    try {
        const response = await fetch('/api/games?' + params.toString());
        if (!response.ok) {
            searchMessage.textContent = 'The games could not be loaded. Please try again later.';
            return;
        }

        const games = await response.json();
        if (games.length === 0) {
            searchMessage.textContent = 'No games found. Try a different title or filter.';
            return;
        }

        searchMessage.textContent = '';
        for (const game of games) {
            const card = createGameCard(game);

            if (currentUser) {
                const addButton = document.createElement('button');
                addButton.textContent = 'Add to collection';
                addButton.addEventListener('click', () => addToCollection(game.id, addButton));
                card.appendChild(addButton);
            }

            searchResults.appendChild(card);
        }
    } catch (err) {
        searchMessage.textContent = 'Cannot reach the server. Is node server.js running?';
    }
}

// ---------- Feature 2: Spiel zur Sammlung hinzufügen ----------

async function addToCollection(gameId, button) {
    button.disabled = true;

    try {
        const response = await fetch('/api/collection/' + gameId, {method: 'PUT'});

        if (response.status === 201) {
            button.textContent = 'Added';
        } else if (response.status === 200) {
            button.textContent = 'Already in collection';
        } else {
            button.textContent = 'Could not add – try again';
            button.disabled = false;
        }
    } catch (err) {
        button.textContent = 'Could not add – try again';
        button.disabled = false;
    }
}

// ---------- Login, Registrierung, Logout ----------

function updatePage() {
    if (currentUser) {
        userInfo.textContent = 'Logged in as ' + currentUser.username;
        userInfo.hidden = false;
        collectionLink.hidden = false;
        logoutButton.hidden = false;
        loginButton.hidden = true;
        registerButton.hidden = true;

        if (currentUser.role === 'admin') {
            adminLink.hidden = false;
        } else {
            adminLink.hidden = true;
        }
    } else {
        userInfo.hidden = true;
        collectionLink.hidden = true;
        adminLink.hidden = true;
        logoutButton.hidden = true;
        loginButton.hidden = false;
        registerButton.hidden = false;
    }
    loadGames();
}

async function sendAccountForm(url, username, password, messageElement, dialog) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: username, password: password})
        });
        const data = await response.json();

        if (!response.ok) {
            messageElement.textContent = data.error;
            return;
        }

        currentUser = data;
        dialog.close();
        updatePage();
    } catch (err) {
        messageElement.textContent = 'Cannot reach the server.';
    }
}

async function loadSession() {
    try {
        const response = await fetch('/api/session');
        currentUser = await response.json();
    } catch (err) {
        currentUser = null;
    }
    updatePage();
}

// ---------- Klicks und Formulare ----------

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    loadGames();
});

loginButton.addEventListener('click', () => {
    document.getElementById('login-form').reset();
    document.getElementById('login-message').textContent = '';
    loginDialog.showModal();
});

document.getElementById('login-cancel').addEventListener('click', () => {
    loginDialog.close();
});

registerButton.addEventListener('click', () => {
    document.getElementById('register-form').reset();
    document.getElementById('register-message').textContent = '';
    registerDialog.showModal();
});

document.getElementById('register-cancel').addEventListener('click', () => {
    registerDialog.close();
});

document.getElementById('login-form').addEventListener('submit', event => {
    event.preventDefault();
    sendAccountForm(
        '/api/login',
        document.getElementById('login-username').value,
        document.getElementById('login-password').value,
        document.getElementById('login-message'),
        loginDialog
    );
});

document.getElementById('register-form').addEventListener('submit', event => {
    event.preventDefault();
    sendAccountForm(
        '/api/register',
        document.getElementById('register-username').value,
        document.getElementById('register-password').value,
        document.getElementById('register-message'),
        registerDialog
    );
});

logoutButton.addEventListener('click', async () => {
    await fetch('/api/logout', {method: 'POST'});
    currentUser = null;
    updatePage();
});

// ---------- Beim Öffnen der Seite ----------

loadSession();