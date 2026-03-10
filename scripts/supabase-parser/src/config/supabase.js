const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Создание клиента Supabase с service role ключом для полного доступа
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Функция для тестирования подключения
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('furniture_categories')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message);
      return false;
    }

    console.log('✅ Подключение к Supabase успешно');
    return true;
  } catch (error) {
    console.error('❌ Критическая ошибка подключения:', error.message);
    return false;
  }
};

// Вспомогательные функции для работы с базой данных
const dbHelpers = {
  // Получение или создание категории
  async getOrCreateCategory(slug, name) {
    try {
      // Сначала пытаемся найти существующую категорию
      let { data, error } = await supabase
        .from('furniture_categories')
        .select('id')
        .eq('slug', slug)
        .single();

      if (data) {
        return data.id;
      }

      // Если не найдена, создаем новую
      const { data: newCategory, error: createError } = await supabase
        .from('furniture_categories')
        .insert({ name, slug })
        .select('id')
        .single();

      if (createError) {
        console.error('Ошибка создания категории:', createError);
        // Возвращаем ID первой категории по умолчанию
        const { data: defaultCategory } = await supabase
          .from('furniture_categories')
          .select('id')
          .limit(1)
          .single();
        return defaultCategory?.id;
      }

      return newCategory.id;
    } catch (error) {
      console.error('Ошибка работы с категорией:', error);
      return null;
    }
  },

  // Получение или создание бренда
  async getOrCreateBrand(name, country = 'Россия') {
    try {
      // Сначала пытаемся найти существующий бренд
      let { data, error } = await supabase
        .from('furniture_brands')
        .select('id')
        .ilike('name', name)
        .single();

      if (data) {
        return data.id;
      }

      // Если не найден, создаем новый
      const { data: newBrand, error: createError } = await supabase
        .from('furniture_brands')
        .insert({ name, country })
        .select('id')
        .single();

      if (createError) {
        console.error('Ошибка создания бренда:', createError);
        // Возвращаем ID бренда "Неизвестный бренд"
        const { data: defaultBrand } = await supabase
          .from('furniture_brands')
          .select('id')
          .eq('name', 'Неизвестный бренд')
          .single();
        return defaultBrand?.id;
      }

      return newBrand.id;
    } catch (error) {
      console.error('Ошибка работы с брендом:', error);
      return null;
    }
  },

  // Поиск существующего товара
  async findExistingItem(name, brandName) {
    try {
      const { data, error } = await supabase
        .from('furniture_items')
        .select(`
          id, name, price_min, price_max, price_avg,
          brand:furniture_brands(name)
        `)
        .ilike('name', name)
        .eq('furniture_brands.name', brandName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Ошибка поиска товара:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Ошибка поиска существующего товара:', error);
      return null;
    }
  },

  // Создание нового товара
  async createFurnitureItem(itemData) {
    try {
      const { data, error } = await supabase
        .from('furniture_items')
        .insert(itemData)
        .select('id')
        .single();

      if (error) {
        console.error('Ошибка создания товара:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Ошибка создания товара:', error);
      return null;
    }
  },

  // Обновление товара
  async updateFurnitureItem(itemId, updateData) {
    try {
      const { error } = await supabase
        .from('furniture_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('Ошибка обновления товара:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      return false;
    }
  },

  // Добавление/обновление источника цены
  async upsertPriceSource(priceSourceData) {
    try {
      const { error } = await supabase
        .from('price_sources')
        .upsert(priceSourceData, {
          onConflict: 'furniture_item_id,source_name'
        });

      if (error) {
        console.error('Ошибка добавления источника цены:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка добавления источника цены:', error);
      return false;
    }
  },

  // Добавление записи в историю цен
  async addPriceHistory(itemId, sourceName, price) {
    try {
      const { error } = await supabase
        .from('price_history')
        .insert({
          furniture_item_id: itemId,
          source_name: sourceName,
          price: price
        });

      if (error) {
        console.error('Ошибка добавления в историю цен:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка добавления в историю цен:', error);
      return false;
    }
  },

  // Получение статистики парсинга
  async getParsingStats() {
    try {
      const { data: totalItems } = await supabase
        .from('furniture_items')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      const { data: recentItems } = await supabase
        .from('furniture_items')
        .select('id', { count: 'exact' })
        .gte('last_parsed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: categories } = await supabase
        .from('furniture_categories')
        .select('id', { count: 'exact' });

      const { data: brands } = await supabase
        .from('furniture_brands')
        .select('id', { count: 'exact' });

      return {
        totalItems: totalItems?.length || 0,
        recentItems: recentItems?.length || 0,
        categories: categories?.length || 0,
        brands: brands?.length || 0
      };
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return {
        totalItems: 0,
        recentItems: 0,
        categories: 0,
        brands: 0
      };
    }
  }
};

module.exports = {
  supabase,
  testConnection,
  dbHelpers
};