import { DEFAULT_SETTINGS, DEFAULT_EXPENSE_TYPES, STORAGE_KEY, STORAGE_VERSION } from './constants.js';

function createInitialData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return {
    version: STORAGE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    expenseTypes: DEFAULT_EXPENSE_TYPES.map(t => ({ ...t })),
    months: {},
    accumulatedSavings: 0,
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = createInitialData();
      saveData(data);
      return data;
    }

    const data = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) {
      const fresh = createInitialData();
      Object.assign(fresh, data, { version: STORAGE_VERSION });
      if (!data.expenseTypes || data.expenseTypes.length === 0) {
        fresh.expenseTypes = DEFAULT_EXPENSE_TYPES.map(t => ({ ...t }));
      }
      saveData(fresh);
      return fresh;
    }

    if (!data.expenseTypes || data.expenseTypes.length === 0) {
      data.expenseTypes = DEFAULT_EXPENSE_TYPES.map(t => ({ ...t }));
    }
    if (!data.months) data.months = {};
    if (data.accumulatedSavings === undefined) data.accumulatedSavings = 0;

    return data;
  } catch {
    const data = createInitialData();
    saveData(data);
    return data;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

export function getMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMonthData(data, year, month) {
  const key = getMonthKey(year, month);
  if (!data.months[key]) {
    data.months[key] = {
      income: 0,
      savings: 0,
      expenses: [],
    };
  }
  return data.months[key];
}

export function calculateBalance(data, year, month) {
  const monthData = getMonthData(data, year, month);
  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const deficit = getDeficitForMonth(data, year, month);
  return monthData.income - totalExpenses - deficit - (monthData.savings || 0);
}

export function getDeficitForMonth(data, year, month) {
  const prevDate = new Date(year, month - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();
  const prevKey = getMonthKey(prevYear, prevMonth);

  if (!data.months[prevKey]) return 0;

  const prevData = data.months[prevKey];
  const prevTotalExpenses = prevData.expenses.reduce((sum, e) => sum + e.value, 0);
  const prevBalance = prevData.income - prevTotalExpenses - prevData.savings;

  if (prevBalance < 0) {
    return Math.abs(prevBalance);
  }
  return 0;
}

export function recalculateAllDeficits(data) {
  const yearMonths = Object.keys(data.months).sort();
  for (let i = 0; i < yearMonths.length; i++) {
    const [year, month] = yearMonths[i].split('-').map(Number);
    const monthData = data.months[yearMonths[i]];
    const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
    monthData.deficit = monthData.deficit || 0;
    const effectiveIncome = monthData.income - monthData.deficit;
    const balance = effectiveIncome - totalExpenses - monthData.savings;

    if (i + 1 < yearMonths.length) {
      const nextKey = yearMonths[i + 1];
      const nextMonthData = data.months[nextKey];
      if (balance < 0) {
        nextMonthData.deficit = Math.abs(balance);
      } else {
        nextMonthData.deficit = 0;
      }
    }
  }
}

export function recalculateAccumulatedSavings(data) {
  let total = 0;
  for (const key of Object.keys(data.months)) {
    const md = data.months[key];
    total += md.savings || 0;
    for (const expense of md.expenses) {
      if (expense.isSavings) {
        total += expense.value;
      }
    }
  }
  data.accumulatedSavings = total;
}

export function exportData(data) {
  const json = JSON.stringify(data, null, 2);
  const filename = `finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (window.AndroidExporter) {
    window.AndroidExporter.downloadFile(filename, json);
    return;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.settings) {
          reject(new Error('Formato de archivo inválido'));
          return;
        }
        saveData(data);
        resolve(data);
      } catch {
        reject(new Error('Error al leer el archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}

export function resetData() {
  const data = createInitialData();
  saveData(data);
  return data;
}
