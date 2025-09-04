import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Проверяем наличие обязательных переменных окружения
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.warn('[Firebase] Отсутствуют переменные окружения:', missingVars.join(', '));
  console.warn('[Firebase] Firebase не будет инициализирован');
}

let app: any = null;
let auth: any = null;

// Инициализируем Firebase только если все переменные окружения присутствуют
if (missingVars.length === 0) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.info('[Firebase] Успешно инициализирован');
  } catch (error) {
    console.error('[Firebase] Ошибка инициализации:', error);
  }
} else {
  console.warn('[Firebase] Firebase не инициализирован из-за отсутствующих переменных окружения');
}

export { auth };

// Получаем список админов из переменных окружения
export const ADMIN_EMAILS = import.meta.env.VITE_FIREBASE_ADMIN_EMAILS?.split(',') || [];

