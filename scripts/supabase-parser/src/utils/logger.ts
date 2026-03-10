import winston from 'winston'
import path from 'path'

export class Logger {
  private logger: winston.Logger

  constructor() {
    // Создаем директорию для логов если её нет
    const logDir = path.join(process.cwd(), 'logs')
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'furniture-parser' },
      transports: [
        // Запись в файл
        new winston.transports.File({ 
          filename: path.join(logDir, 'error.log'), 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({ 
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    })

    // В режиме разработки также выводим в консоль
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
          })
        )
      }))
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta)
  }

  error(message: string, error?: any): void {
    this.logger.error(message, { error: error?.message || error, stack: error?.stack })
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta)
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta)
  }

  // Специальные методы для парсера
  parseStart(source: string, category: string): void {
    this.info(`🔍 Начинаем парсинг ${source}: ${category}`)
  }

  parseSuccess(source: string, count: number): void {
    this.info(`✅ ${source}: получено ${count} товаров`)
  }

  parseError(source: string, error: any): void {
    this.error(`❌ Ошибка парсинга ${source}`, error)
  }

  saveSuccess(count: number): void {
    this.info(`💾 Сохранено товаров: ${count}`)
  }

  saveError(error: any): void {
    this.error('💥 Ошибка сохранения данных', error)
  }
}