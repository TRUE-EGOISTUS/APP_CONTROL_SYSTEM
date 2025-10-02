// Подключаем библиотеку sqlite3 для работы с базой данных SQLite
const sqlite3 = require('sqlite3').verbose();

// Создаём подключение к базе данных database.sqlite
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('Подключение к базе данных SQLite успешно');
  }
});

// Создаём таблицы
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES Users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ProjectStages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      project_id INTEGER,
      FOREIGN KEY (project_id) REFERENCES Projects(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Defects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      project_id INTEGER,
      stage_id INTEGER,
      created_by INTEGER,
      assigned_to INTEGER,
      deadline DATE,
      FOREIGN KEY (project_id) REFERENCES Projects(id),
      FOREIGN KEY (stage_id) REFERENCES ProjectStages(id),
      FOREIGN KEY (created_by) REFERENCES Users(id),
      FOREIGN KEY (assigned_to) REFERENCES Users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_id INTEGER,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_at DATE NOT NULL,
      FOREIGN KEY (defect_id) REFERENCES Defects(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      defect_id INTEGER,
      user_id INTEGER,
      created_at DATE NOT NULL,
      FOREIGN KEY (defect_id) REFERENCES Defects(id),
      FOREIGN KEY (user_id) REFERENCES Users(id)
    )
  `);
});

// Экспортируем db
module.exports = db;
