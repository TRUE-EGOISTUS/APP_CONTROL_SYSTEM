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
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniquePrefix}-${file.originalname}`);
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
        return res.status(401).json({ message: 'Пользователь не найден' });
      }
      req.user = user; // Сохраняем пользователя в запросе
      console.log('Пользователь авторизован:', req.user);
      next();
    });
  });
};

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const error = validateInput(email, password);
  if (error) {
    return res.status(400).json({ message: error });
  }

  db.get('SELECT * FROM Users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Ошибка проверки пользователя:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error('Ошибка сравнения пароля:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (!result) {
        return res.status(401).json({ message: 'Неверный пароль' });
      }

      const sessionId = uuidv4();
      const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
      db.run('INSERT INTO Sessions (sessionId, userId, expires) VALUES (?, ?, ?)', [sessionId, user.id, expires], (err) => {
        if (err) {
          console.error('Ошибка создания сессии:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ message: 'Успешный вход' });
      });
    });
  });
});

app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  const error = validateInput(email, password);
  if (error) {
    return res.status(400).json({ message: error });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Ошибка хеширования пароля:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }

    db.run('INSERT INTO Users (email, password, createdAt) VALUES (?, ?, ?)', [email, hash, Date.now()], (err) => {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }
        console.error('Ошибка регистрации:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      res.json({ message: 'Регистрация успешна' });
    });
  });
});

app.get('/api/profile', authenticateSession, (req, res) => {
  res.json({ message: 'Профиль доступен', user: req.user });
});

app.post('/api/projects', authenticateSession, (req, res) => {
  const { name, description, status } = req.body;
  if (!name || !status) {
    return res.status(400).json({ message: 'Не указаны обязательные поля' });
  }

  db.run('INSERT INTO Projects (name, description, status, createdAt, userId) VALUES (?, ?, ?, ?, ?)', [name, description, status, Date.now(), req.user.id], (err) => {
    if (err) {
      console.error('Ошибка создания проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json({ message: 'Проект создан' });
  });
});

app.put('/api/projects/:id', authenticateSession, (req, res) => {
  const { id } = req.params;
  const { name, description, status, closedAt } = req.body;
  if (!name || !status) {
    return res.status(400).json({ message: 'Не указаны обязательные поля' });
  }

  db.run('UPDATE Projects SET name = ?, description = ?, status = ?, closedAt = ? WHERE id = ? AND userId = ?', [name, description, status, closedAt ? new Date(closedAt).getTime() : null, id, req.user.id], (err) => {
    if (err) {
      console.error('Ошибка обновления проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json({ message: 'Проект обновлён' });
  });
});

app.delete('/api/projects/:id', authenticateSession, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Projects WHERE id = ? AND userId = ?', [id, req.user.id], (err) => {
    if (err) {
      console.error('Ошибка удаления проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json({ message: 'Проект удалён' });
  });
});

app.get('/api/projects', authenticateSession, (req, res) => {
  db.all('SELECT p.id, p.name, p.description, p.status, p.createdAt, p.closedAt, u.email as createdBy FROM Projects p JOIN Users u ON p.userId = u.id WHERE p.userId = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Ошибка получения проектов:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json({ projects: rows });
  });
});

app.post('/api/defects', authenticateSession, upload.array('attachments'), (req, res) => {
  const { projectId, description, priority, status, assigneeId, dueDate } = req.body;
  if (!projectId || !description || !priority || !status) {
    return res.status(400).json({ message: 'Не указаны обязательные поля' });
  }

  db.get('SELECT id FROM Projects WHERE id = ? AND userId = ?', [projectId, req.user.id], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Проект не найден или не принадлежит пользователю' });
    }

    const attachments = req.files.map(file => `/uploads/${file.filename}`);
    db.run('INSERT INTO Defects (projectId, description, priority, status, assigneeId, dueDate, attachments, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [projectId, description, priority, status, assigneeId || null, dueDate ? new Date(dueDate).getTime() : null, JSON.stringify(attachments), Date.now()], (err) => {
      if (err) {
        console.error('Ошибка создания дефекта:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      res.json({ message: 'Дефект создан' });
    });
  });
});

app.put('/api/defects/:id', authenticateSession, upload.array('attachments'), (req, res) => {
  const { id } = req.params;
  const { description, priority, status, assigneeId, dueDate } = req.body;
  if (!description || !priority || !status) {
    return res.status(400).json({ message: 'Не указаны обязательные поля' });
  }

  db.get('SELECT projectId FROM Defects WHERE id = ?', [id], (err, defect) => {
    if (err) {
      console.error('Ошибка проверки дефекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!defect) {
      return res.status(400).json({ message: 'Дефект не найден' });
    }

    db.get('SELECT userId FROM Projects WHERE id = ?', [defect.projectId], (err, project) => {
      if (err) {
        console.error('Ошибка проверки проекта:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Нет прав на редактирование дефекта' });
      }

      const attachments = req.files.map(file => `/uploads/${file.filename}`);
      db.get('SELECT attachments FROM Defects WHERE id = ?', [id], (err, oldDefect) => {
        const oldAttachments = JSON.parse(oldDefect.attachments || '[]');
        const newAttachments = [...oldAttachments, ...attachments];
        db.run('UPDATE Defects SET description = ?, priority = ?, status = ?, assigneeId = ?, dueDate = ?, attachments = ? WHERE id = ?', [description, priority, status, assigneeId || null, dueDate ? new Date(dueDate).getTime() : null, JSON.stringify(newAttachments), id], (err) => {
          if (err) {
            console.error('Ошибка обновления дефекта:', err.message);
            return res.status(500).json({ message: 'Ошибка сервера' });
          }
          res.json({ message: 'Дефект обновлён' });
        });
      });
    });
  });
});

app.delete('/api/defects/:id', authenticateSession, (req, res) => {
  const { id } = req.params;
  db.get('SELECT projectId FROM Defects WHERE id = ?', [id], (err, defect) => {
    if (err) {
      console.error('Ошибка проверки дефекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!defect) {
      return res.status(400).json({ message: 'Дефект не найден' });
    }

    db.get('SELECT userId FROM Projects WHERE id = ?', [defect.projectId], (err, project) => {
      if (err) {
        console.error('Ошибка проверки проекта:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ message: 'Нет прав на удаление дефекта' });
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
});

app.get('/api/defects', authenticateSession, (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
    return res.status(400).json({ message: 'Не указан projectId' });
  }

  db.get('SELECT userId FROM Projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      console.error('Ошибка проверки проекта:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на просмотр дефектов' });
    }

    db.all('SELECT d.id, d.description, d.priority, d.status, d.assigneeId, d.dueDate, d.attachments, d.createdAt, u.email as assigneeEmail FROM Defects d LEFT JOIN Users u ON d.assigneeId = u.id WHERE d.projectId = ?', [projectId], (err, defects) => {
      if (err) {
        console.error('Ошибка получения дефектов:', err.message);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      db.all('SELECT id, email FROM Users WHERE id IN (SELECT DISTINCT assigneeId FROM Defects WHERE projectId = ? AND assigneeId IS NOT NULL)', [projectId], (err, users) => {
        if (err) {
          console.error('Ошибка получения пользователей:', err.message);
          return res.status(500).json({ message: 'Ошибка сервера' });
        }
        res.json({ defects, users });
      });
    });
  });
});

app.get('/api/users', authenticateSession, (req, res) => {
  db.all('SELECT id, email FROM Users WHERE id != ?', [req.user.id], (err, users) => {
    if (err) {
      console.error('Ошибка получения пользователей:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json({ users });
  });
});

app.post('/api/export/projects', authenticateSession, (req, res) => {
  const format = req.body.format || 'csv';
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

app.get('/api/download/attachments/:defectId', authenticateSession, (req, res) => {
  const { defectId } = req.params;
  db.get('SELECT attachments FROM Defects WHERE id = ?', [defectId], (err, defect) => {
    if (err) {
      console.error('Ошибка получения вложений:', err.message);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!defect) {
      return res.status(400).json({ message: 'Дефект не найден' });
    }
    const attachments = JSON.parse(defect.attachments || '[]');
    if (!attachments.length) {
      return res.status(400).json({ message: 'Нет вложений для скачивания' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="attachments_${defectId}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    attachments.forEach(url => {
      const filePath = path.join(uploadDir, path.basename(url));
      console.log(`Попытка добавить файл в ZIP: ${filePath}, существует: ${fs.existsSync(filePath)}`);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: path.basename(filePath) });
      } else {
        console.error(`Файл не найден: ${filePath}`);
      }
    });

    archive.finalize().catch(err => {
      console.error('Ошибка создания ZIP:', err.message);
      res.status(500).json({ message: 'Ошибка сервера при создании ZIP' });
    });
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});