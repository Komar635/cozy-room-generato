const { Pool } = require('pg');
require('dotenv').config();

// Конфигурация подключения к Cloud.ru PostgreSQL
const dbConfig = {
  host: process.env.CLOUD_DB_HOST,
  port: process.env.CLOUD_DB_PORT || 5432,
  database: process.env.CLOUD_DB_NAME,
  user: process.env.CLOUD_DB_USER,
  password: process.env.CLOUD_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Для Cloud.ru может потребоваться
  },
  max: 20, // максимальное количество соединений в пуле
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

// Обработка ошибок подключения
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Функция для выполнения запросов
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Функция для получения клиента из пула
const getClient = async () => {
  return await pool.connect();
};

// Функция для закрытия пула соединений
const closePool = async () => {
  await pool.end();
};

// Проверка подключения к базе данных
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  query,
  getClient,
  closePool,
  testConnection,
  pool
};