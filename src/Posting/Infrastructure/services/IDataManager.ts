import { Result } from '../../../Shared/domain/Result';

export interface DataManagerConfig {
  maxActiveRecords: number;
  maxFileSize: number;
  compressionEnabled: boolean;
  archiveDirectory: string;
  backupDirectory: string;
}

export interface ArchiveMetadata {
  id: string;
  fileName: string;
  created: Date;
  recordCount: number;
  fileSize: number;
  compressed: boolean;
}

export interface DataOperationResult<T> {
  success: boolean;
  data?: T;
  archived?: boolean;
  archiveId?: string;
  error?: string;
}

export interface IDataManager<T> {
  /**
   * Загружает данные из активного файла
   */
  load(filePath: string): Promise<Result<T[]>>;

  /**
   * Сохраняет данные в активный файл с проверкой лимитов
   */
  save(filePath: string, data: T[]): Promise<DataOperationResult<T[]>>;

  /**
   * Добавляет новую запись с автоматической проверкой архивирования
   */
  append(filePath: string, item: T): Promise<DataOperationResult<T>>;

  /**
   * Проверяет необходимость архивирования
   */
  shouldArchive(data: T[]): Promise<boolean>;

  /**
   * Выполняет архивирование данных
   */
  archive(data: T[], archiveName: string): Promise<Result<ArchiveMetadata>>;

  /**
   * Загружает данные из архива
   */
  loadFromArchive(archiveId: string): Promise<Result<T[]>>;

  /**
   * Получает список доступных архивов
   */
  getArchives(): Promise<Result<ArchiveMetadata[]>>;

  /**
   * Создает резервную копию
   */
  backup(filePath: string): Promise<Result<string>>;

  /**
   * Валидирует целостность данных
   */
  validateIntegrity(data: T[]): Result<boolean>;
}
