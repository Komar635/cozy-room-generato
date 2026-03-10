const puppeteer = require('puppeteer');
const axios = require('axios');

class HoffParser {
  constructor() {
    this.baseUrl = 'https://hoff.ru';
    this.catalogUrl = 'https://hoff.ru/catalog/mebel/';
    this.delay = 1500; // Hoff менее строгий к парсингу
  }

  // Получение списка категорий мебели
  async getCategories() {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      await page.goto(this.catalogUrl, { waitUntil: 'networkidle2' });

      const categories = await page.evaluate(() => {
        const categoryLinks = document.querySelectorAll('.catalog-menu__item a');
        return Array.from(categoryLinks).map(link => ({
          name: link.textContent.trim(),
          url: link.href,
          slug: link.href.split('/').pop()
        })).filter(cat => cat.name && cat.url);
      });

      await browser.close();
      return categories;

    } catch (error) {
      if (browser) await browser.close();
      console.error('Ошибка получения категорий Hoff:', error);
      return [];
    }
  }

  // Парсинг товаров из категории
  async parseCategoryProducts(categoryUrl, maxPages = 3) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const allProducts = [];

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const pageUrl = `${categoryUrl}?page=${pageNum}`;
          await page.goto(pageUrl, { waitUntil: 'networkidle2' });

          // Ждем загрузки товаров
          await page.waitForSelector('.product-card', { timeout: 10000 });

          const products = await page.evaluate(() => {
            const productCards = document.querySelectorAll('.product-card');
            const results = [];

            productCards.forEach(card => {
              try {
                // Название
                const nameElement = card.querySelector('.product-card__title a, .product-card__name');
                const name = nameElement ? nameElement.textContent.trim() : '';

                // Цена
                const priceElement = card.querySelector('.product-card__price-current, .price__current');
                let price = 0;
                if (priceElement) {
                  const priceText = priceElement.textContent.replace(/[^\d]/g, '');
                  price = parseInt(priceText) || 0;
                }

                // Старая цена (если есть скидка)
                const oldPriceElement = card.querySelector('.product-card__price-old, .price__old');
                let oldPrice = 0;
                if (oldPriceElement) {
                  const oldPriceText = oldPriceElement.textContent.replace(/[^\d]/g, '');
                  oldPrice = parseInt(oldPriceText) || 0;
                }

                // Ссылка
                const linkElement = card.querySelector('.product-card__title a, .product-card__link');
                const url = linkElement ? linkElement.href : '';

                // Изображение
                const imgElement = card.querySelector('.product-card__image img, .product-image img');
                const image = imgElement ? imgElement.src : '';

                // Бренд
                const brandElement = card.querySelector('.product-card__brand, .brand');
                const brand = brandElement ? brandElement.textContent.trim() : '';

                // Артикул
                const articleElement = card.querySelector('.product-card__article, .article');
                const article = articleElement ? articleElement.textContent.trim() : '';

                if (name && price > 0) {
                  results.push({
                    name,
                    price,
                    oldPrice,
                    url,
                    image,
                    brand,
                    article
                  });
                }
              } catch (error) {
                console.error('Ошибка парсинга карточки Hoff:', error);
              }
            });

            return results;
          });

          allProducts.push(...products);
          console.log(`📄 Страница ${pageNum}: найдено ${products.length} товаров`);

          // Задержка между страницами
          await this.sleep(this.delay);

        } catch (error) {
          console.error(`Ошибка парсинга страницы ${pageNum}:`, error);
          break;
        }
      }

      await browser.close();
      return this.formatProducts(allProducts);

    } catch (error) {
      if (browser) await browser.close();
      console.error('Ошибка парсинга категории Hoff:', error);
      return [];
    }
  }

  // Форматирование данных товаров
  formatProducts(products) {
    return products.map(product => {
      try {
        // Извлекаем ID из URL или создаем уникальный
        const urlMatch = product.url.match(/\/(\d+)\/$/);
        const externalId = urlMatch ? urlMatch[1] : `hoff_${Date.now()}_${Math.random()}`;

        return {
          source: 'hoff',
          external_id: externalId,
          name: product.name,
          price: product.price,
          old_price: product.oldPrice,
          rating: 0, // Hoff не всегда показывает рейтинги
          reviews_count: 0,
          brand: product.brand || this.extractBrand(product.name),
          article: product.article,
          url: product.url,
          images: product.image ? [product.image] : [],
          availability: true,
          category: this.detectCategory(product.name),
          parsed_at: new Date()
        };
      } catch (error) {
        console.error('Ошибка форматирования товара Hoff:', error);
        return null;
      }
    }).filter(item => item !== null);
  }

  // Извлечение бренда из названия
  extractBrand(name) {
    const words = name.split(' ');
    const firstWord = words[0];
    
    if (firstWord && firstWord.length > 2) {
      return firstWord;
    }
    
    return 'Hoff';
  }

  // Определение категории
  detectCategory(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('диван') || nameLower.includes('кресло') || nameLower.includes('софа')) {
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

  // Парсинг всех категорий мебели
  async parseFurnitureCategories() {
    console.log('🏠 Начинаем парсинг Hoff.ru');
    
    // Получаем список категорий
    const categories = await this.getCategories();
    console.log(`📂 Найдено категорий: ${categories.length}`);

    const allProducts = [];

    // Фильтруем только мебельные категории
    const furnitureCategories = categories.filter(cat => {
      const name = cat.name.toLowerCase();
      return name.includes('диван') || name.includes('кресло') || 
             name.includes('стол') || name.includes('шкаф') ||
             name.includes('кровать') || name.includes('стул') ||
             name.includes('комод') || name.includes('тумба') ||
             name.includes('мебель');
    });

    for (const category of furnitureCategories) {
      console.log(`🔍 Парсинг категории: ${category.name}`);
      
      try {
        const products = await this.parseCategoryProducts(category.url, 2);
        allProducts.push(...products);
        
        console.log(`✅ Получено товаров: ${products.length}`);
        
        // Задержка между категориями
        await this.sleep(this.delay * 2);
      } catch (error) {
        console.error(`❌ Ошибка парсинга категории ${category.name}:`, error);
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

        // Характеристики
        const characteristics = [];
        const charRows = document.querySelectorAll('.product-characteristics__row');
        charRows.forEach(row => {
          const name = row.querySelector('.product-characteristics__name');
          const value = row.querySelector('.product-characteristics__value');
          if (name && value) {
            characteristics.push(`${name.textContent.trim()}: ${value.textContent.trim()}`);
          }
        });

        // Размеры
        const dimensions = getTextContent('.product-characteristics__value:contains("см")');

        return {
          description: getTextContent('.product-description__text'),
          characteristics: characteristics,
          dimensions: dimensions,
          images: Array.from(document.querySelectorAll('.product-gallery__image img')).map(img => img.src)
        };
      });

      await browser.close();
      return details;

    } catch (error) {
      if (browser) await browser.close();
      console.error('Ошибка получения деталей товара Hoff:', error);
      return null;
    }
  }

  // Задержка
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HoffParser;