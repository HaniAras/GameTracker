// 1. Geheime Werte aus der .env-Datei laden
require('dotenv').config();

// 2. Express laden und den Server anlegen
const express = require('express');
const app = express();

// 3. Die Dateien im Ordner "public" an den Browser ausliefern
app.use(express.static('public'));

// 4. Ein erster Test-Endpunkt
app.get('/api/hello', (req, res) => {
    res.status(200).json({ message: 'Hallo vom GameTracker-Server!' });
});

// 5. Den Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});