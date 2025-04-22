import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Функция для логирования с временными метками
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [DB] [${level.toUpperCase()}] ${message}`;

  switch(level) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

// Сохраняем начальные значения для кода и время инициализации
const APP_START_TIME = Date.now();

// Начальные значения для кода (не меняем, просто оптимизируем доступ)
const INITIAL_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <title>БерПолитех 2025</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600&display=swap" rel="stylesheet">
</head>
<body>
  <div class="background-container">
    <img src="img/SQcgNc7u2eg.jpg" alt="Здание" class="background-image">

    <div class="content-wrapper">
      <div class="gallery">
        <!-- Верхний ряд партнёров -->
        <div class="partners-row top">
          <div class="gallery-item partner">
            <img src="img/Eurochem-Russia-icon.png" alt="Еврохим">
          </div>
          <div class="gallery-item partner">
            <img src="img/Logo_new_RU.png" alt="Уралхим">
          </div>
        </div>

        <!-- Средний ряд с логотипами -->
        <div class="middle-row">
          <div class="gallery-item medium">
            <img src="img/БПТ.png" alt="БПТ">
          </div>
          <div class="gallery-item medium">
            <img src="img/80ЛЕТПОБЕДЫ.png" alt="80 лет победы">
          </div>
          <div class="gallery-item medium">
            <img src="img/85СПО.png" alt="85 лет СПО">
          </div>
          <div class="gallery-item medium">
            <img src="img/ПРОФЕССИОНАЛИТЕТ.png" alt="Профессионалитет">
          </div>
        </div>

        <!-- Нижний ряд партнёров -->
        <div class="partners-row bottom">
          <div class="gallery-item partner">
            <img src="img/id1w5SyckL_1745361871508.png" alt="Азот">
          </div>
          <div class="gallery-item partner">
            <img src="img/vkk_rus2020.jpg" alt="ВКК">
          </div>
        </div>
      </div>

      <div class="title-bottom">
        <h1>БЕРПОЛИТЕХ-2025</h1>
      </div>
    </div>
  </div>
</body>
</html>`;

const INITIAL_CSS = `body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: 'Montserrat', sans-serif;
}

.background-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: brightness(0.7);
}

.content-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 20px;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 50px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.partners-row {
  display: flex;
  justify-content: center;
  gap: 40px;
  width: 100%;
}

.middle-row {
  display: flex;
  justify-content: center;
  gap: 30px;
  width: 100%;
}

.gallery-item {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.gallery-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.gallery-item img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.partner {
  width: 400px;
  height: 250px;
}

.medium {
  width: 220px;
  height: 150px;
}

.title-bottom {
  text-align: center;
  margin-top: 40px;
}

.title-bottom h1 {
  color: #0066cc;
  font-size: 3.1rem;
  letter-spacing: 2px;
  margin: 0;
  text-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 15px #fff,
    0 0 20px #fff,
    2px 2px 2px rgba(0, 0, 0, 0.5);
  -webkit-text-stroke: 1px white;
  font-weight: 800;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .partner {
    width: 350px;
    height: 220px;
  }

  .medium {
    width: 180px;
    height: 120px;
  }
}

@media (max-width: 900px) {
  .gallery {
    gap: 30px;
  }

  .partner {
    width: 300px;
    height: 190px;
  }

  .middle-row {
    flex-wrap: wrap;
  }

  .medium {
    width: 160px;
    height: 110px;
  }

  .title-bottom h1 {
    font-size: 2.5rem;
  }
}

@media (max-width: 700px) {
  .partners-row {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .partner {
    width: 280px;
    height: 180px;
  }

  .medium {
    width: 140px;
    height: 95px;
  }

  .title-bottom h1 {
    font-size: 2rem;
  }
}`;

// Подготовленные запросы для оптимизации
let selectHtmlStmt;
let selectCssStmt;
let updateCodeStmt;
let insertHistoryStmt;

// Создание и инициализация базы данных
function initDB() {
  // Проверяем существование директории data
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // База данных будет в папке data
  const dbPath = path.join(dataDir, 'code.db');

  // Оптимизируем настройки базы данных
  const db = new Database(dbPath, {
    // Режим журналирования WAL для лучшей производительности
    pragma: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      cache_size: -64000, // 64MB кэш в памяти
      foreign_keys: 'ON'
    }
  });

  // Создаем таблицу для кодов, если она не существует
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_data (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Создаем таблицу для истории изменений
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      user TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Создаем индекс для ускорения поиска по истории
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_code_history_type
    ON code_history(type, created_at DESC)
  `);

  // Проверяем, существуют ли записи для HTML и CSS
  const htmlRecord = db.prepare('SELECT * FROM code_data WHERE type = ?').get('html');
  const cssRecord = db.prepare('SELECT * FROM code_data WHERE type = ?').get('css');

  // Если записей нет, добавляем начальные значения
  if (!htmlRecord) {
    db.prepare('INSERT INTO code_data (id, type, content, updated_at) VALUES (?, ?, ?, ?)').run(
      1, 'html', INITIAL_HTML, APP_START_TIME
    );
  }

  if (!cssRecord) {
    db.prepare('INSERT INTO code_data (id, type, content, updated_at) VALUES (?, ?, ?, ?)').run(
      2, 'css', INITIAL_CSS, APP_START_TIME
    );
  }

  // Подготавливаем запросы для оптимизации
  selectHtmlStmt = db.prepare("SELECT content FROM code_data WHERE type = 'html'");
  selectCssStmt = db.prepare("SELECT content FROM code_data WHERE type = 'css'");
  updateCodeStmt = db.prepare('UPDATE code_data SET content = ?, updated_at = ? WHERE type = ?');
  insertHistoryStmt = db.prepare('INSERT INTO code_history (type, content, user, created_at) VALUES (?, ?, ?, ?)');

  return db;
}

// Получение экземпляра базы данных
let db;
try {
  db = initDB();
  log('База данных успешно инициализирована');
} catch (error) {
  log(`Ошибка при инициализации базы данных: ${error.message}`, 'error');
}

// Оптимизированные функции для работы с базой данных
export function getCodeData() {
  try {
    // Проверяем, что запросы были инициализированы
    if (!selectHtmlStmt || !selectCssStmt) {
      log('Подготовленные запросы не инициализированы', 'error');
      return {
        html: INITIAL_HTML,
        css: INITIAL_CSS
      };
    }

    // Используем подготовленные запросы для получения данных
    const htmlResult = selectHtmlStmt.get();
    const cssResult = selectCssStmt.get();

    const htmlContent = htmlResult?.content || INITIAL_HTML;
    const cssContent = cssResult?.content || INITIAL_CSS;

    return {
      html: htmlContent,
      css: cssContent
    };
  } catch (error) {
    log(`Ошибка при получении данных из БД: ${error.message}`, 'error');
    return {
      html: INITIAL_HTML,
      css: INITIAL_CSS
    };
  }
}

// Добавляем семафор для предотвращения конкурентных обновлений
let isUpdating = false;
const updateQueue = [];

export function updateCode(type, content, userName) {
  // Добавляем задачу в очередь
  return new Promise((resolve, reject) => {
    updateQueue.push({ type, content, userName, resolve, reject });
    processUpdateQueue();
  });
}

// Функция для обработки очереди обновлений
function processUpdateQueue() {
  // Если уже обрабатываем или очередь пуста - выходим
  if (isUpdating || updateQueue.length === 0) return;

  isUpdating = true;

  // Получаем следующую задачу из очереди
  const { type, content, userName, resolve, reject } = updateQueue.shift();

  try {
    const timestamp = Date.now();

    // Начинаем транзакцию для атомарности операции
    const transaction = db.transaction(() => {
      // Обновляем текущее состояние кода
      updateCodeStmt.run(content, timestamp, type);

      // Добавляем запись в историю изменений
      insertHistoryStmt.run(type, content, userName, timestamp);
    });

    // Выполняем транзакцию
    transaction();

    // Задача выполнена успешно
    resolve(true);
  } catch (error) {
    log(`Ошибка при обновлении ${type} кода: ${error.message}`, 'error');
    reject(error);
  } finally {
    // Снимаем флаг и продолжаем обработку очереди
    isUpdating = false;

    // Если есть ещё задачи, продолжаем их обработку
    if (updateQueue.length > 0) {
      processUpdateQueue();
    }
  }
}

export function resetToInitialState() {
  try {
    const timestamp = Date.now();

    // Используем транзакцию для атомарности
    const transaction = db.transaction(() => {
      // Сбрасываем HTML и CSS к начальным значениям
      updateCodeStmt.run(INITIAL_HTML, timestamp, 'html');
      updateCodeStmt.run(INITIAL_CSS, timestamp, 'css');

      // Добавляем запись в историю об этом сбросе
      insertHistoryStmt.run('html', INITIAL_HTML, 'admin_reset', timestamp);
      insertHistoryStmt.run('css', INITIAL_CSS, 'admin_reset', timestamp);
    });

    // Выполняем транзакцию
    transaction();

    log('Данные успешно сброшены к начальному состоянию');
    return true;
  } catch (error) {
    log(`Ошибка при сбросе данных: ${error.message}`, 'error');
    return false;
  }
}

export function getCodeHistory(limit = 10) {
  try {
    // Подготавливаем запрос для получения истории
    const stmt = db.prepare(`
      SELECT * FROM code_history
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  } catch (error) {
    log(`Ошибка при получении истории изменений: ${error.message}`, 'error');
    return [];
  }
}

export default {
  getCodeData,
  updateCode,
  resetToInitialState,
  getCodeHistory
};