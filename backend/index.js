const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors') ;
const app = express();
const port = 3000;
// Подключаемся к SQLite
const db = new sqlite3.Database('./database.db', (err) =>{
if (err) {
  console.error('Ошибка подключения к базе данных:', err.message);
} else {
  console.log('Подключено к базе данных SQLite.');
}
});
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

app.post('/api/login', (req,res) => {
  const {email, password} = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email,password], (err,row) => {
if (err) {
  res.status(500).json({message: 'Ошибка сервера' });
} else if (row) {
  res.json({message: 'Успешный вход', userId: row.id});
} else {
  res.status(401).json({message: 'Неверный email или пароль'});
} 
  });
});

app.post('/api/register',(req,res) => {
    const {email, password} = req.body;
    db.run('INSERT INTO Users (email, password) VALUES (?, ?)', [email, password], function(err){
      if (err) {
        console.error('Ошибка регистрации: ', err.message);
        res.status(400).json({message:'Email уже существует или введены некорректные данные'});
      } else {
        res.json({message: 'Успешная регистрация', userId: this.lastID});
      }
    });
});
// Запускаем сервер
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
