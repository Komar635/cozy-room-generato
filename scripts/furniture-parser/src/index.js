#!/usr/bin/env node

const cron = require('node-cron');
const { testConnection } = require('./config/database');
const WildberriesParser = require('./parsers/wildberries');
const OzonParser = require('./parsers/ozon');
const HoffParser = require('./parsers/hoff');
const DataProcessor = require('./services/dataProcessor');

require('dotenv').config();

class FurnitureParserApp {
  constructor() {
    this.wbParser = new WildberriesParser();
    this.ozonParser = new OzonParser();
    this.hoffParser = new HoffParser();
    this.dataProcessor = new DataProcessor();
    
    this.isRunning = false;
    this.stats = {
      totalParsed: 0,
      totalSaved: 0,
      errors: 0,
      lastRun: null
    };
  }

  // Запуск приложения
  async start() {
    console.log('🚀 Запуск парсера мебели для Cloud.ru');
    console.log('=' .repeat(50));

    // Проверка подключения к базе данных
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Не удалось подключиться к базе данных');
      process.exit(1);
    }

    // Запуск парсинга по расписанию
    const interval = process.env.PARSE_INTERVAL_HOURS || 6;
    console.log(`⏰ Настройка расписания: каждые ${interval} часов`);

    // Запуск сразу при старте
    await this.runParsing();

    // Настройка cron задачи
    cron.schedule(`0 */${interval} * * *`, async () => {
      console.log('⏰ Запуск парсинга по расписанию');
      await this.runParsing();
    });

    console.log('✅ Парсер запущен и работает в фоновом режиме');
    console.log('Для остановки нажмите Ctrl+C');
  }

  // Основной процесс парсинга
  async runParsing() {
    if (this.isRunning) {
      console.log('⚠️ Парсинг уже выполняется, пропускаем...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n🔄 Начинаем парсинг мебели...');
      console.log(`📅 Время запуска: ${new Date().toLocaleString('ru-RU')}`);

      const allProducts = [];

      // Парсинг Wildberries
      console.log('\n🛒 Парсинг Wildberries...');
      try {
        const wbProducts = await this.wbParser.parseFurnitureCategories();
        allProducts.push(...wbProducts);
        console.log(`✅ Wildberries: получено ${wbProducts.length} товаров`);
      } catch (error) {
        console.error('❌ Ошибка парсинга Wildberries:', error.message);
        this.stats.errors++;
      }

      // Задержка между источниками
      await this.sleep(5000);

      // Парсинг Ozon
      console.log('\n🛒 Парсинг Ozon...');
      try {
        const ozonProducts = await this.ozonParser.parseFurnitureCategories();
        allProducts.push(...ozonProducts);
        console.log(`✅ Ozon: получено ${ozonProducts.length} товаров`);
      } catch (error) {
        console.error('❌ Ошибка парсинга Ozon:', error.message);
        this.stats.errors++;
      }

      // Задержка между источниками
      await this.sleep(5000);

      // Парсинг Hoff
      console.log('\n🏠 Парсинг Hoff...');
      try {
        const hoffProducts = await this.hoffParser.parseFurnitureCategories();
        allProducts.push(...hoffProducts);
        console.log(`✅ Hoff: получено ${hoffProducts.length} товаров`);
      } catch (error) {
        console.error('❌ Ошибка парсинга Hoff:', error.message);
        this.stats.errors++;
      }

      // Обработка и сохранение данных
      console.log(`\n💾 Обработка и сохранение ${allProducts.length} товаров...`);
      const { processedItems, errors } = await this.dataProcessor.processFurnitureData(allProducts);

      // Обновление статистики
      this.stats.totalParsed += allProducts.length;
      this.stats.totalSaved += processedItems.length;
      this.stats.errors += errors.length;
      this.stats.lastRun = new Date();

      // Вывод результатов
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log('\n📊 РЕЗУЛЬТАТЫ ПАРСИНГА:');
      console.log('=' .repeat(30));
      console.log(`⏱️  Время выполнения: ${duration} сек`);
      console.log(`📦 Всего получено: ${allProducts.length} товаров`);
      console.log(`💾 Сохранено: ${processedItems.length} товаров`);
      console.log(`❌ Ошибок: ${errors.length}`);
      console.log(`📈 Общая статистика:`);
      console.log(`   - Всего спарсено: ${this.stats.totalParsed}`);
      console.log(`   - Всего сохранено: ${this.stats.totalSaved}`);
      console.log(`   - Всего ошибок: ${this.stats.errors}`);

      // Отправка уведомления (если настроено)
      await this.sendNotification({
        duration,
        parsed: allProducts.length,
        saved: processedItems.length,
        errors: errors.length
      });

    } catch (error) {
      console.error('💥 Критическая ошибка парсинга:', error);
      this.stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  // Отправка уведомлений (можно настроить Telegram, email и т.д.)
  async sendNotification(results) {
    // Здесь можно добавить отправку уведомлений
    // Например, в Telegram бот или на email
    console.log('📬 Уведомление отправлено (функция не настроена)');
  }

  // Получение статистики
  getStats() {
    return this.stats;
  }

  // Ручной запуск парсинга
  async manualParse() {
    console.log('🔧 Ручной запуск парсинга...');
    await this.runParsing();
  }

  // Тестирование парсеров
  async testParsers() {
    console.log('🧪 Тестирование парсеров...');

    // Тест Wildberries
    console.log('\n🛒 Тест Wildberries:');
    try {
      const wbTest = await this.wbParser.searchFurniture('диван', 1);
      console.log(`✅ WB: найдено ${wbTest.length} товаров`);
      if (wbTest.length > 0) {
        console.log(`   Пример: ${wbTest[0].name} - ${wbTest[0].price}₽`);
      }
    } catch (error) {
      console.error('❌ WB тест провален:', error.message);
    }

    // Тест Ozon
    console.log('\n🛒 Тест Ozon:');
    try {
      const ozonTest = await this.ozonParser.searchFurniture('кресло', 1);
      console.log(`✅ Ozon: найдено ${ozonTest.length} товаров`);
      if (ozonTest.length > 0) {
        console.log(`   Пример: ${ozonTest[0].name} - ${ozonTest[0].price}₽`);
      }
    } catch (error) {
      console.error('❌ Ozon тест провален:', error.message);
    }

    // Тест Hoff
    console.log('\n🏠 Тест Hoff:');
    try {
      const categories = await this.hoffParser.getCategories();
      console.log(`✅ Hoff: найдено ${categories.length} категорий`);
      if (categories.length > 0) {
        console.log(`   Пример категории: ${categories[0].name}`);
      }
    } catch (error) {
      console.error('❌ Hoff тест провален:', error.message);
    }
  }

  // Задержка
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Graceful shutdown
  async shutdown() {
    console.log('\n🛑 Получен сигнал остановки...');
    
    if (this.isRunning) {
      console.log('⏳ Ожидание завершения текущего парсинга...');
      while (this.isRunning) {
        await this.sleep(1000);
      }
    }

    console.log('✅ Парсер остановлен');
    process.exit(0);
  }
}

// Создание и запуск приложения
const app = new FurnitureParserApp();

// Обработка аргументов командной строки
const args = process.argv.slice(2);

if (args.includes('--test')) {
  // Режим тестирования
  app.testParsers().then(() => process.exit(0));
} else if (args.includes('--manual')) {
  // Ручной запуск
  app.manualParse().then(() => process.exit(0));
} else if (args.includes('--stats')) {
  // Показать статистику
  console.log('📊 Статистика парсера:', app.getStats());
  process.exit(0);
} else {
  // Обычный запуск с расписанием
  app.start();
}

// Обработка сигналов остановки
process.on('SIGINT', () => app.shutdown());
process.on('SIGTERM', () => app.shutdown());

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Необработанная ошибка Promise:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Необработанная ошибка:', error);
  process.exit(1);
});

module.exports = FurnitureParserApp;