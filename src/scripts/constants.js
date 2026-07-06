export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const CURRENCIES = {
  COP: { code: 'COP', symbol: '$', locale: 'es-CO' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'es-EU' },
  MXN: { code: 'MXN', symbol: '$', locale: 'es-MX' },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR' },
  CLP: { code: 'CLP', symbol: '$', locale: 'es-CL' },
  PEN: { code: 'PEN', symbol: 'S/', locale: 'es-PE' },
};

export const ROUNDING_OPTIONS = [0.01, 100, 500, 1000, 5000, 10000];

export const DEFAULT_SETTINGS = {
  currency: 'COP',
  rounding: 1000,
  theme: 'light',
};

export const DEFAULT_EXPENSE_TYPES = [
  { id: 'food', name: 'Comida', icon: '🍔' },
  { id: 'transport', name: 'Transporte', icon: '🚗' },
  { id: 'home', name: 'Hogar', icon: '🏠' },
  { id: 'leisure', name: 'Ocio', icon: '🎮' },
  { id: 'health', name: 'Salud', icon: '💊' },
  { id: 'education', name: 'Educación', icon: '📚' },
  { id: 'services', name: 'Servicios', icon: '💡' },
  { id: 'shopping', name: 'Compras', icon: '🛒' },
  { id: 'other', name: 'Otros', icon: '📌' },
];

export const STORAGE_KEY = 'finanzas_app_data';
export const STORAGE_VERSION = 1;

export const COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96e6a1',
  '#d4a5a5', '#f0e68c', '#98d8c8', '#f7dc6f',
  '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa',
];
