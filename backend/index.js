const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
    return;
  }
  console.log('Подключено к базе данных SQLite.');

  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt INTEGER
    )
  `, (err) => {
    if (err) {
      console.error('Ошибка создания таблицы Users:', err.message);
    } else {
      console.log('Таблица Users создана или уже существует.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS Sessions (
      sessionId TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      expires INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES Users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Ошибка создания таблицы Sessions:', err.message);
    } else {
      console.log('Таблица Sessions создана или уже существует.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS Projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      createdAt INTEGER NOT NULL,
      closedAt INTEGER,
      userId INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES Users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Ошибка создания таблицы Projects:', err.message);
    } else {
      console.log('Таблица Projects создана или уже существует.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS Defects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'new',
      assigneeId INTEGER,
      dueDate INTEGER,
      attachments TEXT, // JSON-массив URL
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (projectId) REFERENCES Projects(id),
      FOREIGN KEY (assigneeId) REFERENCES Users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Ошибка создания таблицы Defects:', err.message);
    } else {
      console.log('Таблица Defects создана или уже существует.');
    }
  });
});

app.use(cors({ credentials: true, origin: 'http://localhost:8080' }));
app.use(express.json());
app.use(cookieParser());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Уникальное имя файла
  }
});
const upload = multer({ storage });

const validateInput = (email, password) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Некорректный формат email';
  }
  if (password.length < 6) {
    return 'Пароль должен быть не менее 6 символов';
  }
  return null;
};

const authenticateSession = (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  console.log('Проверка сессии:', { sessionId, cookies: req.cookies });
  if (!sessionId) {
    console.log('Сессия не найдена: cookie отсутствует');
    return res.status(401).json({ message: 'Сессия не найдена' });
  }

  db.get('SELECT * FROM Sessions WHERE sessionId = ? AND expires > ?', [sessionId, Date.now()], (err, session) => {
    if (err) {
      console.error('Ошибка проверки сессии:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!session) {
      console.log('Сессия недействительна или истекла:', { sessionId });
      return res.status(401).json({ message: 'Сессия недействительна или истекла' });
    }
    console.log('Сессия найдена:', session);

    db.get('SELECT id, email FROM Users WHERE id = ?', [session.userId], (err, user) => {
      if (err) {
        console.error('Ошибка получения пользователя:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (!user) {
        console.log('Пользователь не найден:', { userId: session.userId });
        return res.status(401).json({ message: 'Пользователь не найден' });
      }
      console.log('Пользователь аутентифицирован:', user);
      req.user = user;
      next();
    });
  });
};

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const validationError = validateInput(email, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  db.get('SELECT * FROM Users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Ошибка запроса к базе данных:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!row) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    bcrypt.compare(password, row.password, (err, isMatch) => {
      if (err) {
        console.error('Ошибка проверки пароля:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (isMatch) {
        const sessionId = uuidv4();
        const expires = Date.now() + 3600 * 1000;
        db.run('INSERT INTO Sessions (sessionId, userId, expires) VALUES (?, ?, ?)', [sessionId, row.id, expires], (err) => {
          if (err) {
            console.error('Ошибка создания сессии:', err.message);
            return res.status(500).json({ message: 'Ошибка сервера' });
          }
          console.log('Сессия создана:', { sessionId, userId: row.id, expires });
          res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600 * 1000
          });
          res.json({ message: 'Успешный вход', userId: row.id });
        });
      } else {
        res.status(401).json({ message: 'Неверный email или пароль' });
      }
    });
  });
});

app.post('/api/register', (req, res) => {
  const { email, password } = req.body;

  const validationError = validateInput(email, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Ошибка хеширования пароля:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }

    db.run('INSERT INTO Users (email, password, createdAt) VALUES (?, ?, ?)', [email, hashedPassword, Date.now()], function (err) {
      if (err) {
        console.error('Ошибка регистрации:', err.message);
        return res.status(400).json({ message: 'Email уже существует или некорректные данные' });
      }
      res.json({ message: 'Успешная регистрация', userId: this.lastID });
    });
  });
});

app.get('/api/profile', authenticateSession, (req, res) => {
  console.log('Доступ к профилю:', req.user);
  res.json({ message: 'Доступ к профилю разрешён', user: req.user });
});

app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    db.run('DELETE FROM Sessions WHERE sessionId = ?', [sessionId], (err) => {
      if (err) {
        console.error('Ошибка удаления сессии:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
    });
  }
  res.clearCookie('sessionId');
  res.json({ message: 'Выход выполнен' });
});

app.post('/api/projects', authenticateSession, (req, res) => {
  const { name, description, status } = req.body;
  if (!name || !status) {
    return res.status(400).json({ message: 'Название и статус проекта обязательны' });
  }
  if (!['open', 'in progress', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус проекта' });
  }

  db.run(
    'INSERT INTO Projects (name, description, status, createdAt, userId) VALUES (?, ?, ?, ?, ?)',
    [name, description || '', status, Date.now(), req.user.id],
    function (err) {
      if (err) {
        console.error('Ошибка создания проекта:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      res.json({ message: 'Проект создан', projectId: this.lastID });
    }
  );
});

app.get('/api/projects', authenticateSession, (req, res) => {
  db.all('SELECT p.id, p.name, p.description, p.status, p.createdAt, p.closedAt, p.userId FROM Projects p WHERE p.userId = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Ошибка получения проектов:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    db.all('SELECT id, email FROM Users', (err, users) => {
      if (err) {
        console.error('Ошибка получения пользователей:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      const projects = rows.map(project => ({
        ...project,
        createdBy: users.find(user => user.id === project.userId)?.email || 'Неизвестно'
      }));
      res.json({ projects, users });
    });
  });
});

app.put('/api/projects/:id', authenticateSession, (req, res) => {
  const { id } = req.params;
  const { name, description, status, closedAt } = req.body;
  if (!name || !status) {
    return res.status(400).json({ message: 'Название и статус проекта обязательны' });
  }
  if (!['open', 'in progress', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус проекта' });
  }

  db.get('SELECT id FROM Projects WHERE id = ? AND userId = ?', [id, req.user.id], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Проект не найден или не принадлежит пользователю' });
    }

    db.run(
      'UPDATE Projects SET name = ?, description = ?, status = ?, closedAt = ? WHERE id = ?',
      [name, description || '', status, closedAt ? parseInt(closedAt) : null, id],
      (err) => {
        if (err) {
          console.error('Ошибка обновления проекта:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.json({ message: 'Проект обновлён' });
      }
    );
  });
});

app.delete('/api/projects/:id', authenticateSession, (req, res) => {
  const { id } = req.params;

  db.get('SELECT id FROM Projects WHERE id = ? AND userId = ?', [id, req.user.id], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Проект не найден или не принадлежит пользователю' });
    }

    db.run('DELETE FROM Defects WHERE projectId = ?', [id], (err) => {
      if (err) {
        console.error('Ошибка удаления дефектов:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      db.run('DELETE FROM Projects WHERE id = ?', [id], (err) => {
        if (err) {
          console.error('Ошибка удаления проекта:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.json({ message: 'Проект удалён' });
      });
    });
  });
});

app.post('/api/defects', authenticateSession, upload.array('attachments', 10), (req, res) => {
  const { projectId, description, priority, status, assigneeId, dueDate } = req.body;
  if (!projectId || !description || !status || !priority) {
    return res.status(400).json({ message: 'projectId, description, status и priority обязательны' });
  }
  if (!['new', 'in_work', 'on_review', 'closed', 'canceled'].includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус дефекта' });
  }
  if (!['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ message: 'Недопустимый приоритет дефекта' });
  }

  db.get('SELECT id FROM Projects WHERE id = ? AND userId = ?', [projectId, req.user.id], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Проект не найден или не принадлежит пользователю' });
    }

    const attachments = req.files.map(file => `/uploads/${file.filename}`); // Формируем URL

    db.run(
      'INSERT INTO Defects (projectId, description, priority, status, assigneeId, dueDate, attachments, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, description, priority, status, assigneeId || null, dueDate ? parseInt(dueDate) : null, JSON.stringify(attachments), Date.now()],
      function (err) {
        if (err) {
          console.error('Ошибка создания дефекта:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.json({ message: 'Дефект создан', defectId: this.lastID });
      }
    );
  });
});

app.get('/api/defects', authenticateSession, (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
    return res.status(400).json({ message: 'Не указан projectId' });
  }

  db.get('SELECT id FROM Projects WHERE id = ? AND userId = ?', [projectId, req.user.id], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Проект не найден или не принадлежит пользователю' });
    }

    db.all('SELECT d.id, d.projectId, d.description, d.priority, d.status, d.assigneeId, d.dueDate, d.attachments, d.createdAt FROM Defects d WHERE d.projectId = ?', [projectId], (err, rows) => {
      if (err) {
        console.error('Ошибка получения дефектов:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      db.all('SELECT id, email FROM Users', (err, users) => {
        if (err) {
          console.error('Ошибка получения пользователей:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        const defects = rows.map(defect => ({
          ...defect,
          attachments: defect.attachments ? JSON.parse(defect.attachments) : [],
          assigneeEmail: users.find(user => user.id === defect.assigneeId)?.email || null
        }));
        res.json({ defects, users });
      });
    });
  });
});

app.put('/api/defects/:id', authenticateSession, upload.array('attachments', 10), (req, res) => {
  const { id } = req.params;
  const { description, priority, status, assigneeId, dueDate } = req.body;
  if (!description || !status || !priority) {
    return res.status(400).json({ message: 'Описание, статус и приоритет дефекта обязательны' });
  }
  if (!['new', 'in_work', 'on_review', 'closed', 'canceled'].includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус дефекта' });
  }
  if (!['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ message: 'Недопустимый приоритет дефекта' });
  }

  db.get('SELECT d.id, d.projectId FROM Defects d JOIN Projects p ON d.projectId = p.id WHERE d.id = ? AND p.userId = ?', [id, req.user.id], (err, defect) => {
    if (err) {
      console.error('Ошибка проверки дефекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!defect) {
      return res.status(400).json({ message: 'Дефект не найден или не принадлежит пользователю' });
    }

    const attachments = req.files.map(file => `/uploads/${file.filename}`); // Формируем URL

    db.run(
      'UPDATE Defects SET description = ?, priority = ?, status = ?, assigneeId = ?, dueDate = ?, attachments = ? WHERE id = ?',
      [description, priority, status, assigneeId || null, dueDate ? parseInt(dueDate) : null, JSON.stringify(attachments), id],
      (err) => {
        if (err) {
          console.error('Ошибка обновления дефекта:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.json({ message: 'Дефект обновлён' });
      }
    );
  });
});

app.delete('/api/defects/:id', authenticateSession, (req, res) => {
  const { id } = req.params;

  db.get('SELECT d.id, d.projectId FROM Defects d JOIN Projects p ON d.projectId = p.id WHERE d.id = ? AND p.userId = ?', [id, req.user.id], (err, defect) => {
    if (err) {
      console.error('Ошибка проверки дефекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!defect) {
      return res.status(400).json({ message: 'Дефект не найден или не принадлежит пользователю' });
    }

    db.run('DELETE FROM Defects WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Ошибка удаления дефекта:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      res.json({ message: 'Дефект удалён' });
    });
  });
});

app.get('/api/users', authenticateSession, (req, res) => {
  db.all('SELECT id, email FROM Users', (err, rows) => {
    if (err) {
      console.error('Ошибка получения пользователей:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json({ users: rows });
  });
});

app.get('/api/export/projects', authenticateSession, (req, res) => {
  const format = req.query.format;
  if (!['csv', 'excel'].includes(format)) {
    return res.status(400).json({ message: 'Недопустимый формат экспорта' });
  }

  db.all('SELECT p.id, p.name, p.description, p.status, p.createdAt, p.closedAt, u.email as createdBy FROM Projects p JOIN Users u ON p.userId = u.id WHERE p.userId = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Ошибка получения проектов для экспорта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }

    if (format === 'csv') {
      const csvWriter = createCsvWriter({
        path: 'projects.csv',
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Название' },
          { id: 'description', title: 'Описание' },
          { id: 'status', title: 'Статус' },
          { id: 'createdAt', title: 'Дата создания' },
          { id: 'closedAt', title: 'Дата закрытия' },
          { id: 'createdBy', title: 'Создал' }
        ]
      });

      csvWriter.writeRecords(rows).then(() => {
        res.download('projects.csv');
      }).catch(err => {
        console.error('Ошибка создания CSV:', err.message);
        res.status(500).json({ message: 'Ошибка сервера' });
      });
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', 'attachment; filename="projects.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    }
  });
});

app.get('/api/export/defects', authenticateSession, (req, res) => {
  const { projectId } = req.query;
  const format = req.query.format;
  if (!projectId || !['csv', 'excel'].includes(format)) {
    return res.status(400).json({ message: 'Не указан projectId или недопустимый формат экспорта' });
  }

  db.get('SELECT id FROM Projects WHERE id = ? AND userId = ?', [projectId, req.user.id], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Проект не найден или не принадлежит пользователю' });
    }

    db.all('SELECT d.id, d.description, d.priority, d.status, d.dueDate, d.createdAt, u.email as assigneeEmail FROM Defects d LEFT JOIN Users u ON d.assigneeId = u.id WHERE d.projectId = ?', [projectId], (err, rows) => {
      if (err) {
        console.error('Ошибка получения дефектов для экспорта:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }

      if (format === 'csv') {
        const csvWriter = createCsvWriter({
          path: `defects_${projectId}.csv`,
          header: [
            { id: 'id', title: 'ID' },
            { id: 'description', title: 'Описание' },
            { id: 'priority', title: 'Приоритет' },
            { id: 'status', title: 'Статус' },
            { id: 'dueDate', title: 'Срок' },
            { id: 'createdAt', title: 'Дата создания' },
            { id: 'assigneeEmail', title: 'Исполнитель' }
          ]
        });

        csvWriter.writeRecords(rows).then(() => {
          res.download(`defects_${projectId}.csv`);
        }).catch(err => {
          console.error('Ошибка создания CSV:', err.message);
          res.status(500).json({ message: 'Ошибка сервера' });
        });
      } else {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Defects');
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', `attachment; filename="defects_${projectId}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});