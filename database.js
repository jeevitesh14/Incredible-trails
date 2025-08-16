// database.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./trips.db");

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination TEXT,
      budget INTEGER,
      weather TEXT,
      itinerary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
