import { formatMoney, formatDate } from '../helpers.js';

export function renderExpenseTable(container, data, year, month, options = {}) {
  const { search = '', sortBy = 'date', sortOrder = 'desc' } = options;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthData = data.months[monthKey];

  const typeMap = {};
  data.expenseTypes.forEach(t => { typeMap[t.id] = t; });

  let expenses = monthData ? [...monthData.expenses] : [];

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    expenses = expenses.filter(e => {
      const type = typeMap[e.typeId];
      const typeName = type ? type.name.toLowerCase() : '';
      const desc = (e.description || '').toLowerCase();
      return typeName.includes(q) || desc.includes(q) || String(e.value).includes(q);
    });
  }

  // Sort
  expenses.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'value') {
      cmp = a.value - b.value;
    } else if (sortBy === 'type') {
      const aName = (typeMap[a.typeId]?.name || '');
      const bName = (typeMap[b.typeId]?.name || '');
      cmp = aName.localeCompare(bName);
    } else {
      cmp = a.date.localeCompare(b.date);
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  if (expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">${search ? 'No se encontraron gastos' : 'No hay gastos este mes'}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="expense-table">
      ${expenses.map(e => {
        const type = typeMap[e.typeId];
        return `
          <div class="expense-item" data-id="${e.id}">
            <div class="expense-icon" style="${e.isSavings ? 'background: var(--accent-light);' : ''}">${type ? type.icon : '📌'}${e.isSavings ? '<span style="font-size:0.6rem;display:block;text-align:center;">🏦</span>' : ''}</div>
            <div class="expense-info">
              <div class="expense-type">${type ? type.name : 'Desconocido'}${e.isSavings ? ' <span class="savings-badge" style="font-size:0.65rem;padding:2px 6px;">Ahorro</span>' : ''}</div>
              ${e.description ? `<div class="expense-desc">${escHtml(e.description)}</div>` : ''}
            </div>
            <div class="expense-value">
              <div class="expense-amount" style="${e.isSavings ? 'color: var(--accent);' : ''}">${e.isSavings ? '' : '−'}${formatMoney(e.value, data.settings.currency)}</div>
              <div class="expense-date">${formatDate(e.date)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.expense-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const expense = expenses.find(e => e.id === id);
      if (expense) {
        // Dispatch custom event for editing
        document.dispatchEvent(new CustomEvent('edit-expense', {
          detail: { expense, year, month }
        }));
      }
    });
  });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
