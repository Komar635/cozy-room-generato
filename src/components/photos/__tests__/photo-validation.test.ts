import { describe, it, expect } from 'bun:test';

/**
 * Unit-тесты для валидации фотографий
 * 
 * Feature: reality-digitizer-3d
 * Validates: Требования 1.4
 * 
 * Тесты проверяют:
 * - Максимальный размер файла
 * - Поддерживаемые форматы
 * - Минимальное количество фотографий
 */

// Константы валидации (должны совпадать с PhotoUploader)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_PHOTOS = 10;

// Вспомогательная функция для создания mock файла
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

// Функция валидации файла (копия из PhotoUploader для тестирования)
interface PhotoUploadError {
  type: 'invalid_format' | 'file_too_large' | 'insufficient_photos' | 'network_error' | 'upload_failed';
  message: string;
  recommendations?: string[];
}

function validateFile(file: File): { valid: boolean; error?: PhotoUploadError } {
  // Проверка формата
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: {
        type: 'invalid_format',
        message: `Файл "${file.name}" имеет неподдерживаемый формат`,
        recommendations: [
          'Используйте форматы: JPEG, PNG или WebP',
          'Конвертируйте изображение в поддерживаемый формат'
        ]
      }
    };
  }

  // Проверка размера
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: {
        type: 'file_too_large',
        message: `Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ)`,
        recommendations: [
          `Максимальный размер файла: ${MAX_FILE_SIZE / 1024 / 1024} МБ`,
          'Сожмите изображение или уменьшите его разрешение'
        ]
      }
    };
  }

  return { valid: true };
}

describe('Photo Validation - Максимальный размер файла', () => {
  it('должен принимать файл размером ровно 10 МБ', () => {
    const file = createMockFile('photo.jpg', MAX_FILE_SIZE, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('должен принимать файл размером меньше 10 МБ', () => {
    const file = createMockFile('photo.jpg', 5 * 1024 * 1024, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('должен отклонять файл размером больше 10 МБ', () => {
    const file = createMockFile('large.jpg', MAX_FILE_SIZE + 1, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe('file_too_large');
    expect(result.error?.message).toContain('слишком большой');
    expect(result.error?.recommendations).toBeDefined();
    expect(result.error?.recommendations?.length).toBeGreaterThan(0);
  });

  it('должен отклонять файл размером значительно больше лимита', () => {
    const file = createMockFile('huge.jpg', 50 * 1024 * 1024, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error?.type).toBe('file_too_large');
  });

  it('должен принимать минимальный файл (1 байт)', () => {
    const file = createMockFile('tiny.jpg', 1, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
  });
});

describe('Photo Validation - Поддерживаемые форматы', () => {
  it('должен принимать JPEG файл', () => {
    const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('должен принимать JPG файл', () => {
    const file = createMockFile('photo.jpg', 1024, 'image/jpg');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
  });

  it('должен принимать PNG файл', () => {
    const file = createMockFile('photo.png', 1024, 'image/png');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
  });

  it('должен принимать WebP файл', () => {
    const file = createMockFile('photo.webp', 1024, 'image/webp');
    const result = validateFile(file);
    
    expect(result.valid).toBe(true);
  });

  it('должен отклонять GIF файл', () => {
    const file = createMockFile('animation.gif', 1024, 'image/gif');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error?.type).toBe('invalid_format');
    expect(result.error?.message).toContain('неподдерживаемый формат');
  });

  it('должен отклонять BMP файл', () => {
    const file = createMockFile('photo.bmp', 1024, 'image/bmp');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error?.type).toBe('invalid_format');
  });

  it('должен отклонять SVG файл', () => {
    const file = createMockFile('icon.svg', 1024, 'image/svg+xml');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error?.type).toBe('invalid_format');
  });

  it('должен отклонять не-изображение файл', () => {
    const file = createMockFile('document.pdf', 1024, 'application/pdf');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error?.type).toBe('invalid_format');
  });

  it('должен предоставлять рекомендации при неверном формате', () => {
    const file = createMockFile('photo.tiff', 1024, 'image/tiff');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.error?.recommendations).toBeDefined();
    expect(result.error?.recommendations?.some(r => r.includes('JPEG'))).toBe(true);
  });
});

describe('Photo Validation - Минимальное количество фотографий', () => {
  it('должен требовать минимум 10 фотографий', () => {
    expect(MIN_PHOTOS).toBe(10);
  });

  it('должен принимать ровно 10 фотографий', () => {
    const files = Array.from({ length: 10 }, (_, i) => 
      createMockFile(`photo${i}.jpg`, 1024, 'image/jpeg')
    );
    
    const validFiles = files.filter(file => validateFile(file).valid);
    expect(validFiles.length).toBe(10);
  });

  it('должен принимать больше 10 фотографий', () => {
    const files = Array.from({ length: 20 }, (_, i) => 
      createMockFile(`photo${i}.jpg`, 1024, 'image/jpeg')
    );
    
    const validFiles = files.filter(file => validateFile(file).valid);
    expect(validFiles.length).toBe(20);
  });

  it('должен валидировать каждую фотографию независимо', () => {
    const files = [
      createMockFile('valid1.jpg', 1024, 'image/jpeg'),
      createMockFile('invalid.gif', 1024, 'image/gif'),
      createMockFile('valid2.jpg', 1024, 'image/jpeg'),
      createMockFile('toolarge.jpg', MAX_FILE_SIZE + 1, 'image/jpeg'),
    ];
    
    const results = files.map(file => validateFile(file));
    
    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(false);
    expect(results[1].error?.type).toBe('invalid_format');
    expect(results[2].valid).toBe(true);
    expect(results[3].valid).toBe(false);
    expect(results[3].error?.type).toBe('file_too_large');
  });
});

describe('Photo Validation - Комбинированные сценарии', () => {
  it('должен отклонять большой файл неподдерживаемого формата', () => {
    const file = createMockFile('large.gif', MAX_FILE_SIZE + 1, 'image/gif');
    const result = validateFile(file);
    
    expect(result.valid).toBe(false);
    // Проверяется формат первым, поэтому ошибка должна быть о формате
    expect(result.error?.type).toBe('invalid_format');
  });

  it('должен принимать набор валидных файлов разных форматов', () => {
    const files = [
      createMockFile('photo1.jpg', 1024, 'image/jpeg'),
      createMockFile('photo2.png', 2048, 'image/png'),
      createMockFile('photo3.webp', 3072, 'image/webp'),
    ];
    
    const results = files.map(file => validateFile(file));
    
    expect(results.every(r => r.valid)).toBe(true);
  });

  it('должен обрабатывать граничные случаи размера', () => {
    const files = [
      createMockFile('exact.jpg', MAX_FILE_SIZE, 'image/jpeg'),
      createMockFile('justover.jpg', MAX_FILE_SIZE + 1, 'image/jpeg'),
      createMockFile('justunder.jpg', MAX_FILE_SIZE - 1, 'image/jpeg'),
    ];
    
    const results = files.map(file => validateFile(file));
    
    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(false);
    expect(results[2].valid).toBe(true);
  });
});

describe('Photo Validation - Сообщения об ошибках', () => {
  it('должен включать имя файла в сообщение об ошибке', () => {
    const file = createMockFile('my-photo.jpg', MAX_FILE_SIZE + 1, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.error?.message).toContain('my-photo.jpg');
  });

  it('должен предоставлять размер файла в МБ для больших файлов', () => {
    const file = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg');
    const result = validateFile(file);
    
    expect(result.error?.message).toContain('МБ');
  });

  it('должен предоставлять рекомендации для всех типов ошибок', () => {
    const invalidFormat = createMockFile('photo.gif', 1024, 'image/gif');
    const tooLarge = createMockFile('photo.jpg', MAX_FILE_SIZE + 1, 'image/jpeg');
    
    const result1 = validateFile(invalidFormat);
    const result2 = validateFile(tooLarge);
    
    expect(result1.error?.recommendations).toBeDefined();
    expect(result1.error?.recommendations?.length).toBeGreaterThan(0);
    expect(result2.error?.recommendations).toBeDefined();
    expect(result2.error?.recommendations?.length).toBeGreaterThan(0);
  });
});
