const { query } = require('../config/database');

class DataProcessor {
  constructor() {
    this.priceThreshold = 0.1; // 10% разница в ценах для обновления
  }

  // Обработка и сохранение данных о мебели
  async processFurnitureData(products) {
    console.log(`📊 Обработка ${products.length} товаров...`);
    
    const processedItems = [];
    const errors = [];

    for (const product of products) {
      try {
        const processedItem = await this.processProduct(product);
        if (processedItem) {
          processedItems.push(processedItem);
        }
      } catch (error) {
        console.error(`Ошибка обработки товара ${product.name}:`, error);
        errors.push({ product: product.name, error: error.message });
      }
    }

    console.log(`✅ Обработано товаров: ${processedItems.length}`);
    console.log(`❌ Ошибок: ${errors.length}`);

    return { processedItems, errors };
  }

  // Обработка отдельного товара
  async processProduct(product) {
    try {
      // Нормализация данных
      const normalizedProduct = this.normalizeProduct(product);
      
      // Поиск существующего товара
      const existingItem = await this.findExistingItem(normalizedProduct);
      
      if (existingItem) {
        // Обновление существующего товара
        return await this.updateExistingItem(existingItem, normalizedProduct);
      } else {
        // Создание нового товара
        return await this.createNewItem(normalizedProduct);
      }
    } catch (error) {
      console.error('Ошибка обработки товара:', error);
      return null;
    }
  }

  // Нормализация данных товара
  normalizeProduct(product) {
    return {
      name: this.cleanString(product.name),
      slug: this.generateSlug(product.name),
      price: Math.round(product.price * 100), // переводим в копейки
      source: product.source,
      external_id: product.external_id,
      brand: this.cleanString(product.brand) || 'Неизвестный бренд',
      category_slug: product.category,
      color: this.extractColor(product.name),
      material: this.extractMaterial(product.name),
      style: this.extractStyle(product.name),
      dimensions: this.extractDimensions(product.characteristics || []),
      images: product.images || [],
      url: product.url,
      rating: product.rating || 0,
      reviews_count: product.reviews_count || 0,
      availability: product.availability !== false,
      description: this.cleanString(product.description || ''),
      characteristics: product.characteristics || []
    };
  }

  // Поиск существующего товара по названию и бренду
  async findExistingItem(product) {
    try {
      const result = await query(`
        SELECT fi.*, fc.slug as category_slug
        FROM furniture_items fi
        LEFT JOIN furniture_categories fc ON fi.category_id = fc.id
        WHERE LOWER(fi.name) = LOWER($1) 
        AND EXISTS (
          SELECT 1 FROM furniture_brands fb 
          WHERE fb.id = fi.brand_id 
          AND LOWER(fb.name) = LOWER($2)
        )
        LIMIT 1
      `, [product.name, product.brand]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка поиска существующего товара:', error);
      return null;
    }
  }

  // Создание нового товара
  async createNewItem(product) {
    try {
      // Получаем или создаем категорию
      const categoryId = await this.getOrCreateCategory(product.category_slug);
      
      // Получаем или создаем бренд
      const brandId = await this.getOrCreateBrand(product.brand);

      // Создаем товар
      const itemResult = await query(`
        INSERT INTO furniture_items (
          name, slug, category_id, brand_id, 
          width_cm, height_cm, depth_cm,
          color, material, style,
          price_min, price_avg, price_max,
          main_image_url, images_urls,
          description, features,
          last_parsed_at, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $11, $11, $12, $13, $14, $15, NOW(), true
        ) RETURNING id
      `, [
        product.name,
        product.slug,
        categoryId,
        brandId,
        product.dimensions.width,
        product.dimensions.height,
        product.dimensions.depth,
        product.color,
        product.material,
        product.style,
        product.price,
        product.images[0] || null,
        product.images,
        product.description,
        product.characteristics
      ]);

      const itemId = itemResult.rows[0].id;

      // Добавляем источник цены
      await this.addPriceSource(itemId, product);

      console.log(`✅ Создан новый товар: ${product.name}`);
      return { id: itemId, action: 'created' };

    } catch (error) {
      console.error('Ошибка создания товара:', error);
      return null;
    }
  }

  // Обновление существующего товара
  async updateExistingItem(existingItem, product) {
    try {
      const itemId = existingItem.id;
      
      // Обновляем источник цены
      await this.updatePriceSource(itemId, product);
      
      // Пересчитываем min/avg/max цены
      const priceStats = await this.calculatePriceStats(itemId);
      
      // Проверяем, нужно ли обновлять основную информацию
      const shouldUpdate = this.shouldUpdateItem(existingItem, product, priceStats);
      
      if (shouldUpdate) {
        await query(`
          UPDATE furniture_items 
          SET 
            price_min = $1,
            price_avg = $2,
            price_max = $3,
            last_parsed_at = NOW(),
            updated_at = NOW()
          WHERE id = $4
        `, [priceStats.min, priceStats.avg, priceStats.max, itemId]);

        console.log(`🔄 Обновлен товар: ${product.name}`);
        return { id: itemId, action: 'updated' };
      } else {
        console.log(`⏭️ Товар не требует обновления: ${product.name}`);
        return { id: itemId, action: 'skipped' };
      }

    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      return null;
    }
  }

  // Добавление источника цены
  async addPriceSource(itemId, product) {
    try {
      await query(`
        INSERT INTO price_sources (
          furniture_item_id, source_name, source_url, 
          price, availability, rating, reviews_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (furniture_item_id, source_name) 
        DO UPDATE SET 
          price = EXCLUDED.price,
          availability = EXCLUDED.availability,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          parsed_at = NOW()
      `, [
        itemId,
        product.source,
        product.url,
        product.price,
        product.availability,
        product.rating,
        product.reviews_count
      ]);

      // Добавляем в историю цен
      await query(`
        INSERT INTO price_history (furniture_item_id, source_name, price)
        VALUES ($1, $2, $3)
      `, [itemId, product.source, product.price]);

    } catch (error) {
      console.error('Ошибка добавления источника цены:', error);
    }
  }

  // Обновление источника цены
  async updatePriceSource(itemId, product) {
    await this.addPriceSource(itemId, product); // Используем ту же логику с ON CONFLICT
  }

  // Расчет статистики цен
  async calculatePriceStats(itemId) {
    try {
      const result = await query(`
        SELECT 
          MIN(price) as min_price,
          AVG(price)::INTEGER as avg_price,
          MAX(price) as max_price
        FROM price_sources 
        WHERE furniture_item_id = $1 AND availability = true
      `, [itemId]);

      const stats = result.rows[0];
      return {
        min: stats.min_price || 0,
        avg: stats.avg_price || 0,
        max: stats.max_price || 0
      };
    } catch (error) {
      console.error('Ошибка расчета статистики цен:', error);
      return { min: 0, avg: 0, max: 0 };
    }
  }

  // Проверка необходимости обновления товара
  shouldUpdateItem(existingItem, product, newPriceStats) {
    // Проверяем изменение цен
    const priceChangeMin = Math.abs(existingItem.price_min - newPriceStats.min) / existingItem.price_min;
    const priceChangeMax = Math.abs(existingItem.price_max - newPriceStats.max) / existingItem.price_max;
    
    return priceChangeMin > this.priceThreshold || priceChangeMax > this.priceThreshold;
  }

  // Получение или создание категории
  async getOrCreateCategory(categorySlug) {
    try {
      let result = await query('SELECT id FROM furniture_categories WHERE slug = $1', [categorySlug]);
      
      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Создаем новую категорию
      const categoryName = this.slugToName(categorySlug);
      result = await query(`
        INSERT INTO furniture_categories (name, slug) 
        VALUES ($1, $2) RETURNING id
      `, [categoryName, categorySlug]);

      return result.rows[0].id;
    } catch (error) {
      console.error('Ошибка работы с категорией:', error);
      return 1; // возвращаем ID первой категории по умолчанию
    }
  }

  // Получение или создание бренда
  async getOrCreateBrand(brandName) {
    try {
      let result = await query('SELECT id FROM furniture_brands WHERE LOWER(name) = LOWER($1)', [brandName]);
      
      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Создаем новый бренд
      result = await query(`
        INSERT INTO furniture_brands (name, country) 
        VALUES ($1, $2) RETURNING id
      `, [brandName, 'Россия']);

      return result.rows[0].id;
    } catch (error) {
      console.error('Ошибка работы с брендом:', error);
      return 1; // возвращаем ID первого бренда по умолчанию
    }
  }

  // Вспомогательные функции
  cleanString(str) {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^а-яё\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }

  slugToName(slug) {
    const slugMap = {
      'sofas-chairs': 'Диваны и кресла',
      'tables': 'Столы',
      'wardrobes-shelves': 'Шкафы и стеллажи',
      'beds': 'Кровати',
      'chairs': 'Стулья',
      'dressers-cabinets': 'Комоды и тумбы',
      'lighting': 'Освещение',
      'textiles': 'Текстиль',
      'decor': 'Декор'
    };
    return slugMap[slug] || slug;
  }

  extractColor(name) {
    const colors = ['белый', 'черный', 'серый', 'коричневый', 'бежевый', 'синий', 'красный', 'зеленый'];
    const nameLower = name.toLowerCase();
    
    for (const color of colors) {
      if (nameLower.includes(color)) {
        return color;
      }
    }
    return 'разноцветный';
  }

  extractMaterial(name) {
    const materials = ['дерево', 'металл', 'пластик', 'ткань', 'кожа', 'стекло', 'мдф', 'лдсп'];
    const nameLower = name.toLowerCase();
    
    for (const material of materials) {
      if (nameLower.includes(material)) {
        return material;
      }
    }
    return 'комбинированный';
  }

  extractStyle(name) {
    const styles = ['современный', 'классический', 'лофт', 'скандинавский', 'минимализм'];
    const nameLower = name.toLowerCase();
    
    for (const style of styles) {
      if (nameLower.includes(style)) {
        return style;
      }
    }
    return 'универсальный';
  }

  extractDimensions(characteristics) {
    const dimensions = { width: null, height: null, depth: null };
    
    characteristics.forEach(char => {
      const charLower = char.toLowerCase();
      
      // Поиск размеров в формате "Ширина: 120 см"
      const widthMatch = charLower.match(/ширина[:\s]*(\d+)/);
      const heightMatch = charLower.match(/высота[:\s]*(\d+)/);
      const depthMatch = charLower.match(/глубина[:\s]*(\d+)/);
      
      if (widthMatch) dimensions.width = parseInt(widthMatch[1]);
      if (heightMatch) dimensions.height = parseInt(heightMatch[1]);
      if (depthMatch) dimensions.depth = parseInt(depthMatch[1]);
    });
    
    return dimensions;
  }
}

module.exports = DataProcessor;