const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const adminMessage = document.getElementById('admin-message');
const stats = document.getElementById('stats');
const mostCollected = document.getElementById('most-collected');

// ---------- Eine Kachel mit Zahl und Beschriftung ----------

function createStatBox(number, label) {
    const box = document.createElement('div');
    box.className = 'stat-box';

    const numberElement = document.createElement('p');
    numberElement.className = 'stat-number';
    numberElement.textContent = number;
    box.appendChild(numberElement);

    const labelElement = document.createElement('p');
    labelElement.className = 'stat-label';
    labelElement.textContent = label;
    box.appendChild(labelElement);

    return box;
}

// ---------- Feature 3: Statistik laden ----------

async function loadStats() {
    adminMessage.textContent = 'Loading statistics …';

    try {
        const response = await fetch('/api/admin/stats');

        if (response.status === 401) {
            location.href = 'index.html';
            return;
        }
        if (response.status === 403) {
            adminMessage.textContent = 'This page is only available for administrators.';
            return;
        }
        if (!response.ok) {
            adminMessage.textContent = 'The statistics could not be loaded.';
            return;
        }

        const data = await response.json();
        adminMessage.textContent = '';

        stats.appendChild(createStatBox(data.totalUsers, 'registered users'));
        stats.appendChild(createStatBox(data.totalEntries, 'games in all collections'));
        stats.appendChild(createStatBox(data.averageCollectionSize, 'games per user on average'));
        stats.appendChild(createStatBox(data.totalFavorites, 'marked as favorite'));
        stats.appendChild(createStatBox(data.totalCompleted, 'marked as completed'));

        if (data.mostCollected.length === 0) {
            const empty = document.createElement('li');
            empty.textContent = 'No games collected yet.';
            mostCollected.appendChild(empty);
            return;
        }

        for (const game of data.mostCollected) {
            const item = document.createElement('li');
            item.textContent = game.title + ' – in ' + game.count + ' collection(s)';
            mostCollected.appendChild(item);
        }
    } catch (err) {
        adminMessage.textContent = 'Cannot reach the server.';
    }
}

// ---------- Session prüfen ----------

async function loadSession() {
    const response = await fetch('/api/session');
    const user = await response.json();

    if (!user || user.role !== 'admin') {
        location.href = 'index.html';
        return;
    }

    userInfo.textContent = 'Logged in as ' + user.username;
    loadStats();
}

// ---------- Klicks ----------

logoutButton.addEventListener('click', async () => {
    await fetch('/api/logout', {method: 'POST'});
    location.href = 'index.html';
});

// ---------- Beim Öffnen der Seite ----------

loadSession();