const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt')
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
});

app.use(cors());
app.use(express.json());

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
        res.json({message: 'Успешный вход', userId: row.id});
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

    bcrypt.hash(password,10,(err, hashedPassword)=>{
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
// Запускаем сервер
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
