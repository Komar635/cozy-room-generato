const puppeteer = require('puppeteer');
const axios = require('axios');

class OzonParser {
  constructor() {
    this.baseUrl = 'https://www.ozon.ru';
    this.searchUrl = 'https://www.ozon.ru/search/';
    this.delay = 3000; // задержка между запросами (Ozon более строгий)
  }

  // Поиск товаров через веб-интерфейс
  async searchFurniture(category, page = 1) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const pageInstance = await browser.newPage();
      
      // Настройка страницы
      await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await pageInstance.setViewport({ width: 1366, height: 768 });

      // Переход на страницу поиска
      const searchUrl = `${this.searchUrl}?text=${encodeURIComponent(category)}&from_global=true`;
      await pageInstance.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Ждем загрузки товаров
      await pageInstance.waitForSelector('[data-widget="searchResultsV2"]', { timeout: 10000 });

      // Извлекаем данные о товарах
      const products = await pageInstance.evaluate(() => {
        const productCards = document.querySelectorAll('[data-widget="searchResultsV2"] > div > div');
        const results = [];

        productCards.forEach((card, index) => {
          try {
            // Название товара
            const nameElement = card.querySelector('a[data-widget="webProductLink"] span, .tsBody500Medium');
            const name = nameElement ? nameElement.textContent.trim() : '';

            // Цена
            const priceElement = card.querySelector('[data-widget="webPrice"] span, .tsHeadline500Medium');
            let price = 0;
            if (priceElement) {
              const priceText = priceElement.textContent.replace(/[^\d]/g, '');
              price = parseInt(priceText) || 0;
            }

            // Ссылка на товар
            const linkElement = card.querySelector('a[data-widget="webProductLink"]');
            const url = linkElement ? linkElement.href : '';

            // Изображение
            const imgElement = card.querySelector('img');
            const image = imgElement ? imgElement.src : '';

            // Рейтинг
            const ratingElement = card.querySelector('[data-widget="webRating"] span');
            const rating = ratingElement ? parseFloat(ratingElement.textContent) || 0 : 0;

            // Количество отзывов
            const reviewsElement = card.querySelector('[data-widget="webRating"] + span');
            const reviewsCount = reviewsElement ? parseInt(reviewsElement.textContent.replace(/[^\d]/g, '')) || 0 : 0;

            if (name && price > 0) {
              results.push({
                name,
                price,
                url,
                image,
                rating,
                reviewsCount,
                index
              });
            }
          } catch (error) {
            console.error('Ошибка парсинга карточки товара:', error);
          }
        });

        return results;
      });

      await browser.close();
      return this.formatProducts(products, category);

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error('Ошибка поиска на Ozon:', error.message);
      return [];
    }
  }

  // Форматирование данных товаров
  formatProducts(products, category) {
    return products.map(product => {
      try {
        // Извлекаем ID товара из URL
        const urlMatch = product.url.match(/\/product\/[^\/]*-(\d+)/);
        const externalId = urlMatch ? urlMatch[1] : `ozon_${Date.now()}_${Math.random()}`;

        return {
          source: 'ozon',
          external_id: externalId,
          name: product.name,
          price: product.price,
          rating: product.rating,
          reviews_count: product.reviewsCount,
          brand: this.extractBrand(product.name),
          url: product.url,
          images: product.image ? [product.image] : [],
          availability: true,
          category: this.detectCategory(product.name),
          parsed_at: new Date()
        };
      } catch (error) {
        console.error('Ошибка форматирования товара Ozon:', error);
        return null;
      }
    }).filter(item => item !== null);
  }

  // Извлечение бренда из названия
  extractBrand(name) {
    // Простая логика извлечения бренда (первое слово в верхнем регистре)
    const words = name.split(' ');
    const firstWord = words[0];
    
    // Проверяем, является ли первое слово брендом
    if (firstWord && firstWord.length > 2 && /^[A-ZА-Я]/.test(firstWord)) {
      return firstWord;
    }
    
    return 'Неизвестный бренд';
  }

  // Определение категории товара
  detectCategory(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('диван') || nameLower.includes('кресло')) {
      return 'sofas-chairs';
    }
    if (nameLower.includes('стол')) {
      return 'tables';
    }
    if (nameLower.includes('шкаф') || nameLower.includes('стеллаж') || nameLower.includes('гардероб')) {
      return 'wardrobes-shelves';
    }
    if (nameLower.includes('кровать') || nameLower.includes('матрас')) {
      return 'beds';
    }
    if (nameLower.includes('стул') || nameLower.includes('табурет')) {
      return 'chairs';
    }
    if (nameLower.includes('комод') || nameLower.includes('тумба')) {
      return 'dressers-cabinets';
    }
    if (nameLower.includes('светильник') || nameLower.includes('лампа') || nameLower.includes('люстра')) {
      return 'lighting';
    }
    if (nameLower.includes('ковер') || nameLower.includes('штора') || nameLower.includes('подушка')) {
      return 'textiles';
    }
    
    return 'decor';
  }

  // Парсинг категорий мебели
  async parseFurnitureCategories() {
    const categories = [
      'диван для гостиной',
      'кресло',
      'обеденный стол',
      'журнальный стол',
      'шкаф для одежды',
      'книжный стеллаж',
      'двуспальная кровать',
      'стул для кухни',
      'комод',
      'прикроватная тумба',
      'настольная лампа',
      'ковер для дома'
    ];

    const allProducts = [];

    for (const category of categories) {
      console.log(`🔍 Парсинг Ozon категории: ${category}`);
      
      try {
        const products = await this.searchFurniture(category);
        allProducts.push(...products);
        
        // Задержка между категориями
        await this.sleep(this.delay);
      } catch (error) {
        console.error(`Ошибка парсинга категории ${category}:`, error);
      }
    }

    return allProducts;
  }

  // Получение детальной информации о товаре
  async getProductDetails(productUrl) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      await page.goto(productUrl, { waitUntil: 'networkidle2' });

      const details = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        // Характеристики товара
        const characteristics = [];
        const charElements = document.querySelectorAll('[data-widget="webCharacteristics"] dl');
        charElements.forEach(dl => {
          const dt = dl.querySelector('dt');
          const dd = dl.querySelector('dd');
          if (dt && dd) {
            characteristics.push(`${dt.textContent.trim()}: ${dd.textContent.trim()}`);
          }
        });

        return {
          description: getTextContent('[data-widget="webDescription"] div'),
          characteristics: characteristics,
          images: Array.from(document.querySelectorAll('[data-widget="webGallery"] img')).map(img => img.src)
        };
      });

      await browser.close();
      return details;

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error('Ошибка получения деталей товара Ozon:', error);
      return null;
    }
  }

  // Задержка
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OzonParser;