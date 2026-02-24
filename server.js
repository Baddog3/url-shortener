const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Отдаём статические файлы (наш index.html и всё рядом).
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

