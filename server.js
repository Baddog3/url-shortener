// Простой сервер на Express для хранения общей статистики.
// Он:
// - отдаёт статические файлы (наш index.html);
// - хранит статистику в файле stats.json;
// - предоставляет API:
//   GET  /api/stats          — получить текущую статистику;
//   POST /api/stats/shorten  — увеличить счётчик сокращений и добавить ссылку;
//   POST /api/stats/qr       — увеличить счётчик QR-кодов.

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Путь к файлу, где будет храниться статистика.
const STATS_FILE = path.join(__dirname, "stats.json");

// Начальное значение статистики.
const DEFAULT_STATS = {
  totalShortened: 0,
  qrGenerated: 0,
  lastLinks: [],
};

function loadStatsFromFile() {
  try {
    if (!fs.existsSync(STATS_FILE)) {
      return { ...DEFAULT_STATS };
    }

    const raw = fs.readFileSync(STATS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      totalShortened: parsed.totalShortened || 0,
      qrGenerated: parsed.qrGenerated || 0,
      lastLinks: Array.isArray(parsed.lastLinks) ? parsed.lastLinks : [],
    };
  } catch (error) {
    console.warn("Не удалось прочитать файл статистики, используем значения по умолчанию.", error);
    return { ...DEFAULT_STATS };
  }
}

function saveStatsToFile(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf8");
  } catch (error) {
    console.error("Не удалось сохранить статистику.", error);
  }
}

// Текущее состояние статистики живёт в памяти.
let stats = loadStatsFromFile();

// Позволяем принимать JSON в теле POST-запросов.
app.use(express.json());

// Отдаём статические файлы (наш index.html и всё рядом).
app.use(express.static(__dirname));

// Получить текущую статистику.
app.get("/api/stats", (req, res) => {
  res.json(stats);
});

// Зарегистрировать факт сокращения ссылки.
app.post("/api/stats/shorten", (req, res) => {
  const { longUrl, shortUrl } = req.body || {};

  if (typeof longUrl !== "string" || typeof shortUrl !== "string") {
    return res.status(400).json({ error: "Неверные данные. Требуются longUrl и shortUrl." });
  }

  const updated = { ...stats };
  updated.totalShortened += 1;

  const MAX_ITEMS = 5;
  const newItem = {
    original: longUrl,
    short: shortUrl,
    time: new Date().toISOString(),
  };

  updated.lastLinks = [newItem].concat(updated.lastLinks || []).slice(0, MAX_ITEMS);

  stats = updated;
  saveStatsToFile(stats);

  res.json(stats);
});

// Зарегистрировать факт создания QR-кода.
app.post("/api/stats/qr", (req, res) => {
  const updated = { ...stats };
  updated.qrGenerated += 1;

  stats = updated;
  saveStatsToFile(stats);

  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

