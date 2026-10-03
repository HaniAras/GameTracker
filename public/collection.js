const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const collectionGenre = document.getElementById('collection-genre');
const collectionPlatform = document.getElementById('collection-platform');
const collectionMessage = document.getElementById('collection-message');
const collectionList = document.getElementById('collection-list');

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

    const addedOn = document.createElement('p');
    addedOn.textContent = 'Added on: ' + game.dateAdded;
    card.appendChild(addedOn);

    const buttons = document.createElement('div');
    buttons.className = 'card-buttons';

    const favoriteButton = document.createElement('button');
    if (game.isFavorite) {
        favoriteButton.textContent = '★ Favorite';
        favoriteButton.className = 'active';
    } else {
        favoriteButton.textContent = '☆ Favorite';
    }
    favoriteButton.addEventListener('click', () => {
        updateEntry(game.id, {isFavorite: !game.isFavorite});
    });
    buttons.appendChild(favoriteButton);

    const completedButton = document.createElement('button');
    if (game.isCompleted) {
        completedButton.textContent = '✓ Completed';
        completedButton.className = 'active';
    } else {
        completedButton.textContent = 'Completed?';
    }
    completedButton.addEventListener('click', () => {
        updateEntry(game.id, {isCompleted: !game.isCompleted});
    });
    buttons.appendChild(completedButton);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        removeEntry(game.id);
    });
    buttons.appendChild(removeButton);

    card.appendChild(buttons);

    return card;
}

// ---------- Feature 2: Sammlung anzeigen ----------

async function loadCollection() {
    const params = new URLSearchParams();
    if (collectionGenre.value) {
        params.append('genre', collectionGenre.value);
    }
    if (collectionPlatform.value) {
        params.append('platform', collectionPlatform.value);
    }

    collectionMessage.textContent = 'Loading your collection …';
    collectionList.innerHTML = '';

    try {
        const response = await fetch('/api/collection?' + params.toString());

        if (response.status === 401) {
            location.href = 'index.html';
            return;
        }
        if (!response.ok) {
            collectionMessage.textContent = 'Your collection could not be loaded.';
            return;
        }

        const games = await response.json();
        if (games.length === 0) {
            collectionMessage.textContent = 'No games here yet. Add games on the "Discover games" page.';
            return;
        }

        collectionMessage.textContent = '';
        for (const game of games) {
            collectionList.appendChild(createGameCard(game));
        }
    } catch (err) {
        collectionMessage.textContent = 'Cannot reach the server.';
    }
}

// ---------- Feature 2: Favorit, Durchgespielt, Entfernen ----------

async function updateEntry(gameId, data) {
    try {
        const response = await fetch('/api/collection/' + gameId, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            collectionMessage.textContent = 'The change could not be saved.';
            return;
        }

        loadCollection();
    } catch (err) {
        collectionMessage.textContent = 'Cannot reach the server.';
    }
}

async function removeEntry(gameId) {
    try {
        const response = await fetch('/api/collection/' + gameId, {method: 'DELETE'});

        if (response.status !== 204) {
            collectionMessage.textContent = 'The game could not be removed.';
            return;
        }

        loadCollection();
    } catch (err) {
        collectionMessage.textContent = 'Cannot reach the server.';
    }
}

// ---------- Session prüfen ----------

async function loadSession() {
    const response = await fetch('/api/session');
    const user = await response.json();

    if (!user) {
        location.href = 'index.html';
        return;
    }

    userInfo.textContent = 'Logged in as ' + user.username;
    loadCollection();
}

// ---------- Klicks und Auswahl ----------

collectionGenre.addEventListener('change', () => {
    loadCollection();
});

collectionPlatform.addEventListener('change', () => {
    loadCollection();
});

logoutButton.addEventListener('click', async () => {
    await fetch('/api/logout', {method: 'POST'});
    location.href = 'index.html';
});

// ---------- Beim Öffnen der Seite ----------

loadSession();