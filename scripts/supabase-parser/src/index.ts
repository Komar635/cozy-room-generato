#!/usr/bin/env node

import cron from 'node-cron'
import { testConnection } from './config/supabase'
import { WildberriesParser } from './parsers/wildberries'
import { OzonParser } from './parsers/ozon'
import { HoffParser } from './parsers/hoff'
import { DataProcessor } from './services/dataProcessor'
import { Logger } from './utils/logger'
import dotenv from 'dotenv'

dotenv.config()

interface ParserStats {
  totalParsed: number
  totalSaved: number
  errors: number
  lastRun: Date | null
}

class FurnitureParserApp {
  private wbParser: WildberriesParser
  private ozonParser: OzonParser
  private hoffParser: HoffParser
  private dataProcessor: DataProcessor
  private logger: Logger
  private isRunning: boolean = false
  private stats: ParserStats = {
    totalParsed: 0,
    totalSaved: 0,
    errors: 0,
    lastRun: null
  }

  constructor() {
    this.wbParser = new WildberriesParser()
    this.ozonParser = new OzonParser()
    this.hoffParser = new HoffParser()
    this.dataProcessor = new DataProcessor()
    this.logger = new Logger()
  }

  // Запуск приложения
  async start(): Promise<void> {
    this.logger.info('🚀 Запуск парсера мебели для Supabase')
    this.logger.info('=' .repeat(50))

    // Проверка подключения к Supabase
    const dbConnected = await testConnection()
    if (!dbConnected) {
      this.logger.error('❌ Не удалось подключиться к Supabase')
      process.exit(1)
    }

    // Запуск парсинга по расписанию
    const interval = parseInt(process.env.PARSE_INTERVAL_HOURS || '6')
    this.logger.info(`⏰ Настройка расписания: каждые ${interval} часов`)

    // Запуск сразу при старте
    await this.runParsing()

    // Настройка cron задачи
    cron.schedule(`0 */${interval} * * *`, async () => {
      this.logger.info('⏰ Запуск парсинга по расписанию')
      await this.runParsing()
    })

    this.logger.info('✅ Парсер запущен и работает в фоновом режиме')
    this.logger.info('Для остановки нажмите Ctrl+C')
  }

  // Основной процесс парсинга
  async runParsing(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('⚠️ Парсинг уже выполняется, пропускаем...')
      return
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      this.logger.info('\n🔄 Начинаем парсинг мебели...')
      this.logger.info(`📅 Время запуска: ${new Date().toLocaleString('ru-RU')}`)

      const allProducts: any[] = []

      // Парсинг Wildberries
      this.logger.info('\n🛒 Парсинг Wildberries...')
      try {
        const wbProducts = await this.wbParser.parseFurnitureCategories()
        allProducts.push(...wbProducts)
        this.logger.info(`✅ Wildberries: получено ${wbProducts.length} товаров`)
      } catch (error) {
        this.logger.error('❌ Ошибка парсинга Wildberries:', error)
        this.stats.errors++
      }

      // Задержка между источниками
      await this.sleep(5000)

      // Парсинг Ozon
      this.logger.info('\n🛒 Парсинг Ozon...')
      try {
        const ozonProducts = await this.ozonParser.parseFurnitureCategories()
        allProducts.push(...ozonProducts)
        this.logger.info(`✅ Ozon: получено ${ozonProducts.length} товаров`)
      } catch (error) {
        this.logger.error('❌ Ошибка парсинга Ozon:', error)
        this.stats.errors++
      }

      // Задержка между источниками
      await this.sleep(5000)

      // Парсинг Hoff
      this.logger.info('\n🏠 Парсинг Hoff...')
      try {
        const hoffProducts = await this.hoffParser.parseFurnitureCategories()
        allProducts.push(...hoffProducts)
        this.logger.info(`✅ Hoff: получено ${hoffProducts.length} товаров`)
      } catch (error) {
        this.logger.error('❌ Ошибка парсинга Hoff:', error)
        this.stats.errors++
      }

      // Обработка и сохранение данных
      this.logger.info(`\n💾 Обработка и сохранение ${allProducts.length} товаров...`)
      const { processedItems, errors } = await this.dataProcessor.processFurnitureData(allProducts)

      // Обновление статистики
      this.stats.totalParsed += allProducts.length
      this.stats.totalSaved += processedItems.length
      this.stats.errors += errors.length
      this.stats.lastRun = new Date()

      // Вывод результатов
      const duration = Math.round((Date.now() - startTime) / 1000)
      this.logger.info('\n📊 РЕЗУЛЬТАТЫ ПАРСИНГА:')
      this.logger.info('=' .repeat(30))
      this.logger.info(`⏱️  Время выполнения: ${duration} сек`)
      this.logger.info(`📦 Всего получено: ${allProducts.length} товаров`)
      this.logger.info(`💾 Сохранено: ${processedItems.length} товаров`)
      this.logger.info(`❌ Ошибок: ${errors.length}`)
      this.logger.info(`📈 Общая статистика:`)
      this.logger.info(`   - Всего спарсено: ${this.stats.totalParsed}`)
      this.logger.info(`   - Всего сохранено: ${this.stats.totalSaved}`)
      this.logger.info(`   - Всего ошибок: ${this.stats.errors}`)

      // Отправка уведомления (если настроено)
      await this.sendNotification({
        duration,
        parsed: allProducts.length,
        saved: processedItems.length,
        errors: errors.length
      })

    } catch (error) {
      this.logger.error('💥 Критическая ошибка парсинга:', error)
      this.stats.errors++
    } finally {
      this.isRunning = false
    }
  }

  // Отправка уведомлений
  private async sendNotification(results: {
    duration: number
    parsed: number
    saved: number
    errors: number
  }): Promise<void> {
    // Здесь можно добавить отправку в Telegram, Discord, email и т.д.
    this.logger.info('📬 Уведомление: функция не настроена')
  }

  // Получение статистики
  getStats(): ParserStats {
    return this.stats
  }

  // Ручной запуск парсинга
  async manualParse(): Promise<void> {
    this.logger.info('🔧 Ручной запуск парсинга...')
    await this.runParsing()
  }

  // Тестирование парсеров
  async testParsers(): Promise<void> {
    this.logger.info('🧪 Тестирование парсеров...')

    // Тест Wildberries
    this.logger.info('\n🛒 Тест Wildberries:')
    try {
      const wbTest = await this.wbParser.searchFurniture('диван', 1)
      this.logger.info(`✅ WB: найдено ${wbTest.length} товаров`)
      if (wbTest.length > 0) {
        this.logger.info(`   Пример: ${wbTest[0].name} - ${wbTest[0].price}₽`)
      }
    } catch (error) {
      this.logger.error('❌ WB тест провален:', error)
    }

    // Тест Ozon
    this.logger.info('\n🛒 Тест Ozon:')
    try {
      const ozonTest = await this.ozonParser.searchFurniture('кресло', 1)
      this.logger.info(`✅ Ozon: найдено ${ozonTest.length} товаров`)
      if (ozonTest.length > 0) {
        this.logger.info(`   Пример: ${ozonTest[0].name} - ${ozonTest[0].price}₽`)
      }
    } catch (error) {
      this.logger.error('❌ Ozon тест провален:', error)
    }

    // Тест Hoff
    this.logger.info('\n🏠 Тест Hoff:')
    try {
      const categories = await this.hoffParser.getCategories()
      this.logger.info(`✅ Hoff: найдено ${categories.length} категорий`)
      if (categories.length > 0) {
        this.logger.info(`   Пример категории: ${categories[0].name}`)
      }
    } catch (error) {
      this.logger.error('❌ Hoff тест провален:', error)
    }
  }

  // Задержка
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    this.logger.info('\n🛑 Получен сигнал остановки...')
    
    if (this.isRunning) {
      this.logger.info('⏳ Ожидание завершения текущего парсинга...')
      while (this.isRunning) {
        await this.sleep(1000)
      }
    }

    this.logger.info('✅ Парсер остановлен')
    process.exit(0)
  }
}

// Создание и запуск приложения
const app = new FurnitureParserApp()

// Обработка аргументов командной строки
const args = process.argv.slice(2)

if (args.includes('--test')) {
  // Режим тестирования
  app.testParsers().then(() => process.exit(0))
} else if (args.includes('--manual')) {
  // Ручной запуск
  app.manualParse().then(() => process.exit(0))
} else if (args.includes('--stats')) {
  // Показать статистику
  console.log('📊 Статистика парсера:', app.getStats())
  process.exit(0)
} else {
  // Обычный запуск с расписанием
  app.start()
}

// Обработка сигналов остановки
process.on('SIGINT', () => app.shutdown())
process.on('SIGTERM', () => app.shutdown())

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Необработанная ошибка Promise:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('💥 Необработанная ошибка:', error)
  process.exit(1)
})

export default FurnitureParserApp