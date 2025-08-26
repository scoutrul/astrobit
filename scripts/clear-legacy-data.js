// Скрипт для очистки legacy mock данных из localStorage
// Запустите в DevTools консоли браузера: node scripts/clear-legacy-data.js

console.log('🧹 Очистка legacy данных AstroBit...');

try {
  // Основные ключи для удаления
  const keysToRemove = [
    'astrobit_posts',
    'astrobit_tags', 
    'astrobit_archives',
    'astrobit_settings'
  ];

  let removedCount = 0;

  // Удаляем основные ключи
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`✅ Удален ключ: ${key}`);
    }
  });

  // Удаляем ключи с демо данными и AI cache
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('ai_cache_') ||
      key.includes('demo') ||
      key.includes('phase4') ||
      key.includes('mock') ||
      key.includes('sample') ||
      key.startsWith('posting_')
    )) {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`✅ Удален ключ: ${key}`);
    }
  }

  console.log(`🎉 Очистка завершена! Удалено ${removedCount} ключей.`);
  console.log('📍 Перезагрузите страницу для применения изменений.');

} catch (error) {
  console.error('❌ Ошибка при очистке:', error);
}

// Для использования в браузере:
// 1. Откройте DevTools (F12)
// 2. Перейдите на вкладку Console
// 3. Скопируйте и вставьте этот код
// 4. Нажмите Enter
