const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../tasks.db');

let db;

function getDb(customPath) {
  const targetPath = customPath || dbPath;
  if (!db) {
    db = new sqlite3.Database(targetPath, (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
      } else {
        console.log(`Connected to SQLite database at ${targetPath}`);
      }
    });
  }
  return db;
}

function initDb(customDb) {
  const activeDb = customDb || getDb();
  return new Promise((resolve, reject) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    activeDb.run(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating table:', err);
        return reject(err);
      }
      resolve(activeDb);
    });
  });
}

function dbAll(sql, params = [], activeDb = getDb()) {
  return new Promise((resolve, reject) => {
    activeDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(sql, params = [], activeDb = getDb()) {
  return new Promise((resolve, reject) => {
    activeDb.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(sql, params = [], activeDb = getDb()) {
  return new Promise((resolve, reject) => {
    activeDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function closeDb(activeDb = db) {
  return new Promise((resolve, reject) => {
    if (!activeDb) return resolve();
    activeDb.close((err) => {
      if (err) return reject(err);
      db = null;
      resolve();
    });
  });
}

module.exports = {
  getDb,
  initDb,
  dbAll,
  dbGet,
  dbRun,
  closeDb
};
