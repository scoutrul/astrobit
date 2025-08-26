import { Result } from '../../../Shared/domain/Result';
import { 
  IDataManager, 
  DataManagerConfig, 
  ArchiveMetadata, 
  DataOperationResult 
} from './IDataManager';

interface InMemoryCache<T> {
  data: T[];
  lastModified: Date;
  isDirty: boolean;
}

export class JsonDataManager<T extends { id: string; createdAt: Date }> implements IDataManager<T> {
  private readonly config: DataManagerConfig;
  private cache = new Map<string, InMemoryCache<T>>();
  private readonly localStorage: Storage;

  constructor(config?: Partial<DataManagerConfig>) {
    this.config = {
      maxActiveRecords: config?.maxActiveRecords || 200,
      maxFileSize: config?.maxFileSize || 5 * 1024 * 1024, // 5MB
      compressionEnabled: config?.compressionEnabled || true,
      archiveDirectory: config?.archiveDirectory || 'archives',
      backupDirectory: config?.backupDirectory || 'backups',
      ...config
    };

    this.localStorage = window.localStorage;
    
    console.info('[JsonDataManager] Инициализирован с конфигурацией:', this.config);
  }

  async load(filePath: string): Promise<Result<T[]>> {
    try {
      // Проверяем кэш
      if (this.cache.has(filePath)) {
        const cached = this.cache.get(filePath)!;
        console.info(`[JsonDataManager] Загружено из кэша: ${filePath} (${cached.data.length} записей)`);
        return Result.ok(cached.data);
      }

      // Пытаемся загрузить из localStorage (для измененных данных)
      const localKey = this.getLocalStorageKey(filePath);
      const localData = this.localStorage.getItem(localKey);
      
      if (localData) {
        try {
          const parsedData = JSON.parse(localData) as T[];
          this.updateCache(filePath, parsedData);
          console.info(`[JsonDataManager] Загружено из localStorage: ${filePath} (${parsedData.length} записей)`);
          return Result.ok(parsedData);
        } catch (parseError) {
          console.warn(`[JsonDataManager] Ошибка парсинга localStorage для ${filePath}:`, parseError);
        }
      }

      // Загружаем из статического файла
      const response = await fetch(filePath);
      if (!response.ok) {
        if (response.status === 404) {
          // Файл не найден - возвращаем пустой массив
          console.info(`[JsonDataManager] Файл не найден: ${filePath}, создаем пустой массив`);
          const emptyData: T[] = [];
          this.updateCache(filePath, emptyData);
          return Result.ok(emptyData);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Проверяем, является ли data массивом
      if (!Array.isArray(rawData)) {
        console.warn(`[JsonDataManager] Данные в ${filePath} не являются массивом, возвращаем пустой массив`);
        const emptyData: T[] = [];
        this.updateCache(filePath, emptyData);
        return Result.ok(emptyData);
      }
      
      const data = rawData as T[];
      this.updateCache(filePath, data);
      
      console.info(`[JsonDataManager] Загружено из файла: ${filePath} (${data.length} записей)`);
      return Result.ok(data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`[JsonDataManager] Ошибка загрузки ${filePath}:`, error);
      return Result.fail(`Ошибка загрузки данных: ${errorMessage}`);
    }
  }

  async save(filePath: string, data: T[]): Promise<DataOperationResult<T[]>> {
    try {
      // Валидация данных
      const validation = this.validateIntegrity(data);
      if (!validation.isSuccess) {
        return {
          success: false,
          error: `Валидация не пройдена: ${validation.error}`
        };
      }

      // Проверяем необходимость архивирования
      const shouldArchive = await this.shouldArchive(data);
      let archiveId: string | undefined;

      if (shouldArchive) {
        console.info(`[JsonDataManager] Требуется архивирование для ${filePath}`);
        
        // Создаем архив
        const archiveName = this.generateArchiveName(filePath);
        const archiveResult = await this.archive(data, archiveName);
        
        if (archiveResult.isSuccess) {
          archiveId = archiveResult.value.id;
          console.info(`[JsonDataManager] Архив создан: ${archiveId}`);
          
          // Оставляем только последние записи
          data = this.trimToRecentRecords(data);
        } else {
          console.warn(`[JsonDataManager] Ошибка архивирования:`, archiveResult.error);
        }
      }

      // Создаем резервную копию
      const backupResult = await this.backup(filePath);
      if (!backupResult.isSuccess) {
        console.warn(`[JsonDataManager] Ошибка создания backup:`, backupResult.error);
      }

      // Атомарное сохранение
      const localKey = this.getLocalStorageKey(filePath);
      const serializedData = JSON.stringify(data, null, 2);
      
      // Проверяем размер данных
      if (new Blob([serializedData]).size > this.config.maxFileSize) {
        return {
          success: false,
          error: `Размер данных превышает лимит ${this.config.maxFileSize} байт`
        };
      }

      this.localStorage.setItem(localKey, serializedData);
      this.updateCache(filePath, data);

      console.info(`[JsonDataManager] Данные сохранены: ${filePath} (${data.length} записей)`);

      return {
        success: true,
        data,
        archived: shouldArchive,
        archiveId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`[JsonDataManager] Ошибка сохранения ${filePath}:`, error);
      return {
        success: false,
        error: `Ошибка сохранения: ${errorMessage}`
      };
    }
  }

  async append(filePath: string, item: T): Promise<DataOperationResult<T>> {
    try {
      const loadResult = await this.load(filePath);
      if (!loadResult.isSuccess) {
        return {
          success: false,
          error: `Ошибка загрузки для добавления: ${loadResult.error}`
        };
      }

      const data = [...loadResult.value, item];
      const saveResult = await this.save(filePath, data);

      if (saveResult.success) {
        return {
          success: true,
          data: item,
          archived: saveResult.archived,
          archiveId: saveResult.archiveId
        };
      } else {
        return {
          success: false,
          error: saveResult.error
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`[JsonDataManager] Ошибка добавления записи в ${filePath}:`, error);
      return {
        success: false,
        error: `Ошибка добавления записи: ${errorMessage}`
      };
    }
  }

  async shouldArchive(data: T[]): Promise<boolean> {
    const recordCount = data.length;
    const dataSize = new Blob([JSON.stringify(data)]).size;

    const exceedsRecordLimit = recordCount > this.config.maxActiveRecords;
    const exceedsSizeLimit = dataSize > this.config.maxFileSize;

    console.info(`[JsonDataManager] Проверка архивирования: записей=${recordCount}/${this.config.maxActiveRecords}, размер=${dataSize}/${this.config.maxFileSize}`);

    return exceedsRecordLimit || exceedsSizeLimit;
  }

  async archive(data: T[], archiveName: string): Promise<Result<ArchiveMetadata>> {
    try {
      const archiveId = `${archiveName}_${Date.now()}`;
      const archiveKey = this.getArchiveKey(archiveId);
      
      // Сортируем данные по дате для архива
      const sortedData = [...data].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      let archiveData: string;
      if (this.config.compressionEnabled) {
        // Простая "компрессия" через удаление пробелов
        archiveData = JSON.stringify(sortedData);
      } else {
        archiveData = JSON.stringify(sortedData, null, 2);
      }

      const archiveSize = new Blob([archiveData]).size;
      
      // Сохраняем архив
      this.localStorage.setItem(archiveKey, archiveData);

      // Создаем метаданные архива
      const metadata: ArchiveMetadata = {
        id: archiveId,
        fileName: `${archiveName}.json${this.config.compressionEnabled ? '.gz' : ''}`,
        created: new Date(),
        recordCount: sortedData.length,
        fileSize: archiveSize,
        compressed: this.config.compressionEnabled
      };

      // Обновляем индекс архивов
      await this.updateArchiveIndex(metadata);

      console.info(`[JsonDataManager] Архив создан: ${archiveId} (${sortedData.length} записей, ${archiveSize} байт)`);
      
      return Result.ok(metadata);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`[JsonDataManager] Ошибка создания архива ${archiveName}:`, error);
      return Result.fail(`Ошибка архивирования: ${errorMessage}`);
    }
  }

  async loadFromArchive(archiveId: string): Promise<Result<T[]>> {
    try {
      const archiveKey = this.getArchiveKey(archiveId);
      const archiveData = this.localStorage.getItem(archiveKey);

      if (!archiveData) {
        return Result.fail(`Архив не найден: ${archiveId}`);
      }

      const data = JSON.parse(archiveData) as T[];
      console.info(`[JsonDataManager] Загружено из архива ${archiveId}: ${data.length} записей`);
      
      return Result.ok(data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`[JsonDataManager] Ошибка загрузки архива ${archiveId}:`, error);
      return Result.fail(`Ошибка загрузки архива: ${errorMessage}`);
    }
  }

  async getArchives(): Promise<Result<ArchiveMetadata[]>> {
    try {
      const indexKey = this.getArchiveIndexKey();
      const indexData = this.localStorage.getItem(indexKey);

      if (!indexData) {
        console.info('[JsonDataManager] Индекс архивов не найден, возвращаем пустой список');
        return Result.ok([]);
      }

      const index = JSON.parse(indexData);
      const archives = index.archives || [];
      
      console.info(`[JsonDataManager] Загружен список архивов: ${archives.length} архивов`);
      return Result.ok(archives);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('[JsonDataManager] Ошибка загрузки списка архивов:', error);
      return Result.fail(`Ошибка загрузки архивов: ${errorMessage}`);
    }
  }

  async backup(filePath: string): Promise<Result<string>> {
    try {
      const loadResult = await this.load(filePath);
      if (!loadResult.isSuccess) {
        return Result.fail(`Ошибка загрузки для backup: ${loadResult.error}`);
      }

      const backupId = `backup_${this.getFileNameFromPath(filePath)}_${Date.now()}`;
      const backupKey = this.getBackupKey(backupId);
      const backupData = JSON.stringify(loadResult.value);

      this.localStorage.setItem(backupKey, backupData);
      
      console.info(`[JsonDataManager] Backup создан: ${backupId}`);
      return Result.ok(backupId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`[JsonDataManager] Ошибка создания backup для ${filePath}:`, error);
      return Result.fail(`Ошибка backup: ${errorMessage}`);
    }
  }

  validateIntegrity(data: T[]): Result<boolean> {
    try {
      if (!Array.isArray(data)) {
        return Result.fail('Данные должны быть массивом');
      }

      // Проверяем обязательные поля
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.id || typeof item.id !== 'string') {
          return Result.fail(`Запись ${i}: отсутствует или неверный id`);
        }
        if (!item.createdAt) {
          return Result.fail(`Запись ${i}: отсутствует createdAt`);
        }
      }

      // Проверяем уникальность id
      const ids = data.map(item => item.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        return Result.fail('Найдены дублирующиеся id');
      }

      return Result.ok(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
              return Result.fail(`Ошибка валидации: ${errorMessage}`);
    }
  }

  // Приватные методы
  private updateCache(filePath: string, data: T[]): void {
    this.cache.set(filePath, {
      data: [...data], // Создаем копию
      lastModified: new Date(),
      isDirty: false
    });
  }

  private getLocalStorageKey(filePath: string): string {
    return `astrobit_data_${this.getFileNameFromPath(filePath)}`;
  }

  private getArchiveKey(archiveId: string): string {
    return `astrobit_archive_${archiveId}`;
  }

  private getBackupKey(backupId: string): string {
    return `astrobit_backup_${backupId}`;
  }

  private getArchiveIndexKey(): string {
    return 'astrobit_archive_index';
  }

  private getFileNameFromPath(filePath: string): string {
    return filePath.split('/').pop()?.replace('.json', '') || 'unknown';
  }

  private generateArchiveName(filePath: string): string {
    const fileName = this.getFileNameFromPath(filePath);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${fileName}_${year}${month}`;
  }

  private trimToRecentRecords(data: T[]): T[] {
    // Оставляем 70% от максимального количества записей
    const keepCount = Math.floor(this.config.maxActiveRecords * 0.7);
    
    // Сортируем по дате создания (новые первые) и берем нужное количество
    return [...data]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, keepCount);
  }

  private async updateArchiveIndex(newArchive: ArchiveMetadata): Promise<void> {
    try {
      const indexKey = this.getArchiveIndexKey();
      const existingIndex = this.localStorage.getItem(indexKey);
      
      let index: any = {
        lastUpdate: new Date().toISOString(),
        totalArchives: 0,
        archives: [],
        totalPosts: 0,
        config: this.config
      };

      if (existingIndex) {
        index = JSON.parse(existingIndex);
      }

      // Добавляем новый архив
      index.archives.push(newArchive);
      index.totalArchives = index.archives.length;
      index.totalPosts += newArchive.recordCount;
      index.lastUpdate = new Date().toISOString();

      this.localStorage.setItem(indexKey, JSON.stringify(index, null, 2));
      
    } catch (error) {
      console.error('[JsonDataManager] Ошибка обновления индекса архивов:', error);
    }
  }
}
