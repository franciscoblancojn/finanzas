import { loadData, saveData, getMonthData, calculateBalance, recalculateAccumulatedSavings } from './storage.js';
import { formatMoney, getTodayString, roundUp } from './helpers.js';
import { renderCalendarNav } from './components/CalendarNav.js';
import { renderBalance } from './components/BalanceWidget.js';
import { renderExpenseTable } from './components/ExpenseTable.js';
import { openExpenseForm } from './components/ExpenseFormModal.js';
import { showIncomeModal } from './components/IncomeModal.js';
import { renderAnalytics } from './components/Analytics.js';
import { renderSettings, applyTheme } from './components/SettingsPanel.js';
import { showToast } from './components/Toast.js';

let appData;
let currentYear;
let currentMonth;
let currentScreen = 'expenses';
let searchValue = '';
let sortBy = 'date';
let sortOrder = 'desc';
let deferredInstallPrompt = null;
let isTransitioning = false;

export function initApp() {
  appData = loadData();

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  applyTheme(appData.settings.theme);

  setupNavigation();
  setupFAB();
  setupSearch();
  setupSortChips();
  setupKeyboardShortcuts();
  setupEditExpenseListener();
  setupCloseButton();
  setupInstallPrompt();
  setupSwipeNavigation();

  render();
}

function setupCloseButton() {
  const btn = document.getElementById('btn-close');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (window.AndroidExporter) {
      window.AndroidExporter.closeApp();
    } else {
      window.close();
    }
  });
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
    document.dispatchEvent(new CustomEvent('install-ready'));
  });
  window.addEventListener('appinstalled', () => {
    window.deferredInstallPrompt = null;
    document.dispatchEvent(new CustomEvent('install-ready'));
  });
}

function render() {
  renderCalendar();
  renderCurrentScreen();
  updateFABVisibility();
  updateSavingsBadge();
  saveData(appData);
}

function renderCalendar() {
  const container = document.getElementById('calendar-nav');
  if (!container) return;
  renderCalendarNav(container, appData, currentYear, currentMonth, (month, year) => {
    closeAllModals();
    currentMonth = month;
    currentYear = year;
    render();
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.remove();
  });
  const incomeModal = document.getElementById('income-modal');
  if (incomeModal) incomeModal.remove();
}

function renderCurrentScreen() {
  switch (currentScreen) {
    case 'expenses':
      renderExpensesScreen();
      break;
    case 'analytics':
      renderAnalyticsScreen();
      break;
    case 'settings':
      renderSettingsScreen();
      break;
  }
}

function renderExpensesScreen() {
  const container = document.getElementById('screen-expenses');
  if (!container) return;

  container.style.display = 'block';
  const analyticsEl = document.getElementById('screen-analytics');
  const settingsEl = document.getElementById('screen-settings');
  if (analyticsEl) analyticsEl.style.display = 'none';
  if (settingsEl) settingsEl.style.display = 'none';

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const monthData = getMonthData(appData, currentYear, currentMonth);

  renderBalance(document.getElementById('balance-container'), appData, currentYear, currentMonth);

  const tableContainer = document.getElementById('expense-table-container');
  if (tableContainer) {
    renderExpenseTable(tableContainer, appData, currentYear, currentMonth, {
      search: searchValue,
      sortBy,
      sortOrder,
    });
  }

  if (!monthData.income || monthData.income <= 0) {
    showIncomeModal(appData, currentYear, currentMonth, (income, savings) => {
      monthData.income = income;
      monthData.savings = savings || 0;
      recalculateAccumulatedSavings(appData);
      saveData(appData);
      render();
      showToast('Ingreso registrado', 'success');
    });
  }
}

function renderAnalyticsScreen() {
  const container = document.getElementById('screen-analytics');
  if (!container) return;

  container.style.display = 'block';
  const expensesEl = document.getElementById('screen-expenses');
  const settingsEl = document.getElementById('screen-settings');
  if (expensesEl) expensesEl.style.display = 'none';
  if (settingsEl) settingsEl.style.display = 'none';

  renderAnalytics(container, appData);
}

function renderSettingsScreen() {
  const container = document.getElementById('screen-settings');
  if (!container) return;

  container.style.display = 'block';
  const expensesEl = document.getElementById('screen-expenses');
  const analyticsEl = document.getElementById('screen-analytics');
  if (expensesEl) expensesEl.style.display = 'none';
  if (analyticsEl) analyticsEl.style.display = 'none';

  renderSettings(container, appData, (updatedData) => {
    appData = updatedData;
    saveData(appData);
    render();
  });
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const screen = item.dataset.screen;
      if (!screen) return;
      switchScreen(screen);
    });
  });
}

function setupFAB() {
  const fab = document.getElementById('fab');
  if (!fab) return;

  fab.addEventListener('click', () => {
    if (currentScreen !== 'expenses') return;

    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthData = getMonthData(appData, currentYear, currentMonth);

    if (!monthData.income || monthData.income <= 0) {
      showToast('Primero registra el ingreso del mes', 'error');
      return;
    }

    openExpenseForm(appData, currentYear, currentMonth, null, (expenseOrNull, deleteId) => {
      if (deleteId) {
        monthData.expenses = monthData.expenses.filter(e => e.id !== deleteId);
        recalculateAccumulatedSavings(appData);
        saveData(appData);
        render();
        showToast('Gasto eliminado', 'info');
      } else if (expenseOrNull) {
        const existingIdx = monthData.expenses.findIndex(e => e.id === expenseOrNull.id);
        if (existingIdx >= 0) {
          monthData.expenses[existingIdx] = expenseOrNull;
          showToast('Gasto actualizado', 'success');
        } else {
          monthData.expenses.push(expenseOrNull);
          showToast('Gasto registrado', 'success');
        }
        monthData.expenses.sort((a, b) => b.date.localeCompare(a.date));
        recalculateAccumulatedSavings(appData);
        saveData(appData);
        render();
      }
    });
  });
}

function setupEditExpenseListener() {
  document.addEventListener('edit-expense', (e) => {
    const { expense, year, month } = e.detail;
    if (currentScreen !== 'expenses') return;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthData = getMonthData(appData, year, month);

    openExpenseForm(appData, year, month, expense, (expenseOrNull, deleteId) => {
      if (deleteId) {
        monthData.expenses = monthData.expenses.filter(ex => ex.id !== deleteId);
        recalculateAccumulatedSavings(appData);
        saveData(appData);
        render();
        showToast('Gasto eliminado', 'info');
      } else if (expenseOrNull) {
        const existingIdx = monthData.expenses.findIndex(ex => ex.id === expenseOrNull.id);
        if (existingIdx >= 0) {
          monthData.expenses[existingIdx] = expenseOrNull;
        }
        monthData.expenses.sort((a, b) => b.date.localeCompare(a.date));
        recalculateAccumulatedSavings(appData);
        saveData(appData);
        render();
        showToast('Gasto actualizado', 'success');
      }
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    searchValue = searchInput.value;
    if (currentScreen === 'expenses') {
      renderExpensesScreen();
    }
  });
}

function setupSortChips() {
  document.querySelectorAll('.sort-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sort = chip.dataset.sort;
      if (!sort) return;

      if (sortBy === sort) {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      } else {
        sortBy = sort;
        sortOrder = 'desc';
      }

      document.querySelectorAll('.sort-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (currentScreen === 'expenses') {
        renderExpensesScreen();
      }
    });
  });
}

function updateFABVisibility() {
  const fab = document.getElementById('fab');
  if (fab) {
    fab.style.display = currentScreen === 'expenses' ? 'flex' : 'none';
  }
}

function updateSavingsBadge() {
  const badge = document.getElementById('savings-badge');
  if (!badge) return;
  const amountEl = document.getElementById('savings-amount');
  if (appData.accumulatedSavings > 0) {
    badge.style.display = 'inline-flex';
    if (amountEl) {
      amountEl.textContent = formatMoney(appData.accumulatedSavings, appData.settings.currency);
    }
  } else {
    badge.style.display = 'none';
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case 'n':
      case 'N':
        e.preventDefault();
        document.getElementById('fab')?.click();
        break;
      case '1':
        switchScreen('expenses');
        break;
      case '2':
        switchScreen('analytics');
        break;
      case '3':
        switchScreen('settings');
        break;
      case 'Escape':
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        break;
    }
  });
}

const SCREENS = ['expenses', 'analytics', 'settings'];

function setupSwipeNavigation() {
  let touchStartX = 0;
  let touchStartY = 0;
  const MIN_SWIPE = 60;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) < MIN_SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const activeModal = document.querySelector('.modal-overlay.open');
    if (activeModal) return;

    const idx = SCREENS.indexOf(currentScreen);
    if (dx < 0 && idx < SCREENS.length - 1) {
      switchScreen(SCREENS[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      switchScreen(SCREENS[idx - 1]);
    }
  }, { passive: true });
}

function switchScreen(screen) {
  if (screen === currentScreen || isTransitioning) return;
  isTransitioning = true;

  const oldIdx = SCREENS.indexOf(currentScreen);
  const newIdx = SCREENS.indexOf(screen);
  const forward = newIdx > oldIdx;

  const oldEl = document.getElementById(`screen-${currentScreen}`);
  if (!oldEl) {
    isTransitioning = false;
    return;
  }

  oldEl.classList.add(forward ? 'slide-out-left' : 'slide-out-right');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-screen="${screen}"]`);
  if (navItem) navItem.classList.add('active');

  currentScreen = screen;

  setTimeout(() => {
    oldEl.classList.remove('slide-out-left', 'slide-out-right');

    const newEl = document.getElementById(`screen-${screen}`);
    if (newEl) {
      newEl.classList.add(forward ? 'slide-in-right' : 'slide-in-left');
    }

    render();

    setTimeout(() => {
      if (newEl) {
        newEl.classList.remove('slide-in-right', 'slide-in-left');
      }
      isTransitioning = false;
    }, 200);
  }, 200);
}

window.initApp = initApp;
