const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

// Подключаемся к SQLite
const db = new sqlite3.Database('./database.db', (err) =>{
if (err) {
  console.error('Ошибка подключения к базе данных:', err.message);
} else {
  console.log('Подключено к базе данных SQLite.');
}
db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
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
});

app.use(cors({credentials: true, origin:'http://localhost:8080'}));
app.use(express.json());
app.use(cookieParser());

const validateInput = (email,password) =>{
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Некорректный формат email';
  }
  if (password.length < 6) {
    return 'Пароль должен содержать не менее 6 символов';
  }
  return null;
};

const authentificateSession = (req, res, next) =>{
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({message: 'Сессия не найдена'});
  }
  db.get('SELECT * FROM Sessions WHERE sessionId = ? AND expires > ?', [sessionId, Date.now()], (err, session) => {
    if (err) {
      console.error('Ошибка проверки сессии:', err.message);
      return res.status(500).json({message: 'Ошибка сервера'});
    }
    if (!session) {
      return res.status(401).json({message: 'Сессия недействительна или истекла'});
    }

   db.get('SELECT id, email FROM Users WHERE id = ?', [session.userId], (err,user) => {
    if (err) {
      console.error('Ошибка получения пользователя:', err.message);
      return res.status(500).json({message: 'Ошибка сервера'});      
    }
    if (!user) {
      return res.status(401).json({message:'Пользователь на найден'});
    }
    req.user = user;
    next();
   }); 
  });
}

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

app.post('/api/login', (req,res) => {
  const {email, password} = req.body;
  
  const validationError = validateInput(email,password);
  if (validationError) {
    return res.status(400).json({message: validationError});
  }

  db.get('SELECT * FROM Users WHERE email = ?', [email], (err,row) => {
    if (err) {
      console.error('Ошибка запроса к базе данных:', err.message);
      res.status(500).json({message: 'Ошибка сервера' });
    } 
    if (!row) {
    res.status(401).json({message: 'Неверный email или пароль'});
    } 

    bcrypt.compare(password, row.password, (err, isMatch) =>{
      if (err) {
        console.error('Ошибка проверки пароля:', err.message);
        return res.status(500).json({message: 'Ошибка сервера'});
      }
      if (isMatch) {
        const sessionId = uuidv4();
        const expires = Date.now() + 3600 * 1000;
        db.run('INSERT INTO Sessions (sessionId, userId, expires) VALUES (?, ?, ?)', [sessionId, row.id, expires], (err) => {
          if (err) {
            console.error('Ошибка создания сессии:', err.message);
            return res.status(500).json({message:'Ошибка сервера'});
          }
          res.cookie('sessionId',sessionId,{
            httpOnly: true,
            secure: false,
            maxAge: 3600 * 1000
          });
          res.json({message: 'Успешный вход', userId: row.id});
        });
      } else {
        res.status(401).json({message:'Неверный email или пароль'});
      }
    });
});
});

app.post('/api/register',(req,res) => {
    const {email, password} = req.body;

    const validationError = validateInput(email,password);
    if (validationError) {
      return res.status(400).json({message: validationError});
    }

    bcrypt.hash(password, 10, (err, hashedPassword)=>{
      if (err){
        console.error('Ошибка хеширования пароля:', err.message);
        return res.status(500).json({message:'Ошибка сервера'});
      }
    
    db.run('INSERT INTO Users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err){
      if (err) {
        console.error('Ошибка регистрации: ', err.message);
        res.status(400).json({message:'Email уже существует или введены некорректные данные'});
      } else {
        res.json({message: 'Успешная регистрация', userId: this.lastID});
      }
      });
    });
});

app.get('/api/profile', authentificateSession, (req, res) => {
  res.json({message: 'Доступ к профилю разрешён', user: req.user});
});

app.post('/api/logout', (req, res)=>{
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    db.run('DELETE FROM Sessions WHERE sessionId = ?', [sessionId], (err) => {
      if (err) {
        console.error('Ошибка удаления сессии', err.message);
        return res.status(500).json({message: 'Ошибка сервера'});
      }
    });
  }
  res.clearCookie('sessionId');
  res.json({message: 'Выход выполнен'});
});
// Запускаем сервер
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
