import { formatMoney, getMonthName } from '../helpers.js';
import { calculateBalance } from '../storage.js';

export function renderBalance(container, data, year, month) {
  const monthData = data.months[`${year}-${String(month).padStart(2, '0')}`];
  if (!monthData) {
    container.innerHTML = `
      <div class="balance-widget">
        <div class="balance-card">
          <div class="balance-label">Balance</div>
          <div class="balance-amount">${formatMoney(0, data.settings.currency)}</div>
        </div>
      </div>
    `;
    return;
  }

  const totalExpenses = monthData.expenses.reduce((sum, e) => sum + e.value, 0);
  const balance = calculateBalance(data, year, month);
  const isPositive = balance >= 0;
  const deficit = monthData.deficit || 0;

  container.innerHTML = `
    <div class="balance-widget" id="balance-widget">
      <div class="balance-card">
        <div class="balance-label">Balance de ${getMonthName(month)} ${year}</div>
        <div class="balance-amount" style="color: ${isPositive ? '#2ecc71' : '#e74c3c'}">
          ${isPositive ? '' : '−'}${formatMoney(Math.abs(balance), data.settings.currency)}
        </div>
        <div class="balance-breakdown">
          <div class="balance-breakdown-item">
            <span class="balance-breakdown-dot" style="background: var(--success)"></span>
            Ingresos: ${formatMoney(monthData.income || 0, data.settings.currency)}
          </div>
          <div class="balance-breakdown-item">
            <span class="balance-breakdown-dot" style="background: var(--danger)"></span>
            Gastos: ${formatMoney(totalExpenses, data.settings.currency)}
          </div>
          ${monthData.savings ? `
          <div class="balance-breakdown-item">
            <span class="balance-breakdown-dot" style="background: var(--accent)"></span>
            Ahorro: ${formatMoney(monthData.savings, data.settings.currency)}
          </div>` : ''}
          ${deficit ? `
          <div class="balance-breakdown-item">
            <span class="balance-breakdown-dot" style="background: var(--warning)"></span>
            Déficit: ${formatMoney(deficit, data.settings.currency)}
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
}
