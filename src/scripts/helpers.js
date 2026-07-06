import { CURRENCIES, MONTHS } from './constants.js';

export function roundUp(value, rounding) {
  if (!rounding || rounding <= 0) return value;
  return Math.ceil(value / rounding) * rounding;
}

export function formatMoney(value, currencyCode = 'COP') {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.COP;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency.symbol}${value.toLocaleString()}`;
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getMonthName(monthIndex) {
  return MONTHS[monthIndex] || '';
}

export function getYearsWithData(data) {
  const years = new Set();
  for (const key of Object.keys(data.months)) {
    const [year] = key.split('-');
    years.add(Number(year));
  }
  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function getMonthsWithData(data, year) {
  const months = [];
  for (const key of Object.keys(data.months)) {
    const [y, m] = key.split('-').map(Number);
    if (y === year) {
      months.push(m);
    }
  }
  return months.sort((a, b) => b - a);
}
