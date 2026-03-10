const puppeteer = require('puppeteer');
const axios = require('axios');

class WildberriesParser {
  constructor() {
    this.baseUrl = 'https://www.wildberries.ru';
    this.searchUrl = 'https://search.wb.ru/exactmatch/ru/common/v4/search';
    this.delay = 2000; // задержка между запросами
  }

  // Поиск товаров по категории
  async searchFurniture(category, page = 1) {
    try {
      const searchParams = {
        appType: 1,
        curr: 'rub',
        dest: -1257786,
        page: page,
        query: category,
        resultset: 'catalog',
        sort: 'popular',
        spp: 0,
        suppressSpellcheck: false
      };

      const response = await axios.get(this.searchUrl, {
        params: searchParams,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      });

      if (response.data && response.data.data && response.data.data.products) {
        return this.parseProducts(response.data.data.products);
      }

      return [];
    } catch (error) {
      console.error('Ошибка поиска на Wildberries:', error.message);
      return [];
    }
  }

  // Парсинг данных о товарах
  parseProducts(products) {
    return products.map(product => {
      try {
        // Получаем цену (WB хранит цены в копейках)
        const priceData = product.priceU || product.salePriceU || 0;
        const price = Math.round(priceData / 100); // переводим в рубли

        // Формируем URL товара
        const productUrl = `${this.baseUrl}/catalog/${product.id}/detail.aspx`;

        // Получаем изображения
        const images = this.getProductImages(product);

        return {
          source: 'wildberries',
          external_id: product.id.toString(),
          name: product.name || '',
          price: price,
          rating: product.rating || 0,
          reviews_count: product.feedbacks || 0,
          brand: product.brand || '',
          url: productUrl,
          images: images,
          availability: true,
          category: this.detectCategory(product.name),
          parsed_at: new Date()
        };
      } catch (error) {
        console.error('Ошибка парсинга товара WB:', error);
        return null;
      }
    }).filter(item => item !== null);
  }

  // Получение URL изображений товара
  getProductImages(product) {
    const images = [];
    
    if (product.pics) {
      // WB использует специальный формат для изображений
      const baseImageUrl = 'https://images.wbstatic.net/c516x688/';
      
      product.pics.forEach(pic => {
        if (pic) {
          const imageUrl = `${baseImageUrl}${pic}.jpg`;
          images.push(imageUrl);
        }
      });
    }

    return images;
  }

  // Определение категории товара по названию
  detectCategory(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('диван') || nameLower.includes('кресло')) {
      return 'sofas-chairs';
    }
    if (nameLower.includes('стол')) {
      return 'tables';
    }
    if (nameLower.includes('шкаф') || nameLower.includes('стеллаж')) {
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
    
    return 'decor'; // по умолчанию
  }

  // Парсинг конкретных категорий мебели
  async parseFurnitureCategories() {
    const categories = [
      'диван',
      'кресло', 
      'стол обеденный',
      'стол журнальный',
      'шкаф',
      'стеллаж',
      'кровать',
      'стул',
      'комод',
      'тумба',
      'светильник',
      'ковер'
    ];

    const allProducts = [];

    for (const category of categories) {
      console.log(`🔍 Парсинг категории: ${category}`);
      
      try {
        // Парсим первые 3 страницы каждой категории
        for (let page = 1; page <= 3; page++) {
          const products = await this.searchFurniture(category, page);
          allProducts.push(...products);
          
          // Задержка между запросами
          await this.sleep(this.delay);
        }
      } catch (error) {
        console.error(`Ошибка парсинга категории ${category}:`, error);
      }
    }

    return allProducts;
  }

  // Задержка
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Получение детальной информации о товаре
  async getProductDetails(productId) {
    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const url = `${this.baseUrl}/catalog/${productId}/detail.aspx`;
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Извлекаем дополнительные данные
      const details = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        return {
          description: getTextContent('.product-page__description-text'),
          characteristics: Array.from(document.querySelectorAll('.product-params__row')).map(row => {
            const name = row.querySelector('.product-params__cell:first-child')?.textContent?.trim();
            const value = row.querySelector('.product-params__cell:last-child')?.textContent?.trim();
            return name && value ? `${name}: ${value}` : null;
          }).filter(Boolean),
          dimensions: getTextContent('.product-params__cell:contains("Размер")')
        };
      });

      await browser.close();
      return details;
    } catch (error) {
      console.error('Ошибка получения деталей товара:', error);
      return null;
    }
  }
}

module.exports = WildberriesParser;