
const express = require('express');
const db = require('./config/db'); // Подключаем базу данных

const app = express();

// Разрешаем парсить JSON
app.use(express.json());

// Тестовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

// Запускаем сервер
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
