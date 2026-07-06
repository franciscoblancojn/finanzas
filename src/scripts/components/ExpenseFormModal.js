import { generateId, getTodayString, roundUp } from '../helpers.js';
import { renderTypeSelector } from './TypeManager.js';
import { showToast } from './Toast.js';

export function openExpenseForm(data, year, month, expenseToEdit = null, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay modal-right open';
  overlay.id = 'expense-form-overlay';

  const editing = expenseToEdit !== null;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthData = data.months[monthKey] || { expenses: [] };

  overlay.innerHTML = `
    <div class="modal-content" style="height: 100vh; max-height: 100vh; border-radius: 0;">
      <div class="modal-header">
        <div class="modal-title">${editing ? 'Editar gasto' : 'Nuevo gasto'}</div>
        <button class="modal-close" id="expense-form-close">✕</button>
      </div>
      <form id="expense-form">
        <div class="form-group">
          <label class="form-label">Tipo de gasto</label>
          <div id="expense-type-selector"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción (opcional)</label>
          <textarea class="form-textarea" id="expense-desc" placeholder="Describe el gasto..." maxlength="200">${expenseToEdit?.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Valor</label>
          <div class="money-input-group">
            <span class="currency-symbol">${getCurrencySymbol(data.settings.currency)}</span>
            <input class="form-input" id="expense-value" type="number" step="1" min="1" placeholder="0" value="${expenseToEdit?.value || ''}" required>
          </div>
          <div id="expense-value-error" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-input" id="expense-date" type="date" value="${expenseToEdit?.date || getTodayString()}" required>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" style="flex:1" id="expense-form-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" style="flex:1">
            ${editing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
        ${editing ? `<button type="button" class="btn btn-danger btn-block" style="margin-top:8px" id="expense-form-delete">Eliminar gasto</button>` : ''}
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const typeSelector = overlay.querySelector('#expense-type-selector');
  let selectedTypeId = expenseToEdit?.typeId || data.expenseTypes[0]?.id || '';

  renderTypeSelector(typeSelector, data.expenseTypes, selectedTypeId, (newTypeId) => {
    selectedTypeId = newTypeId;
    // Re-render if types changed
    renderTypeSelector(typeSelector, data.expenseTypes, selectedTypeId, (nt) => {
      selectedTypeId = nt;
    });
  });

  function close() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 300);
  }

  overlay.querySelector('#expense-form-close').addEventListener('click', close);
  overlay.querySelector('#expense-form-cancel').addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const form = overlay.querySelector('#expense-form');
  const valueInput = overlay.querySelector('#expense-value');
  const valueError = overlay.querySelector('#expense-value-error');
  const descInput = overlay.querySelector('#expense-desc');
  const dateInput = overlay.querySelector('#expense-date');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!selectedTypeId) {
      showToast('Selecciona un tipo de gasto', 'error');
      return;
    }

    const rawValue = parseFloat(valueInput.value);
    if (isNaN(rawValue) || rawValue <= 0) {
      valueError.textContent = 'Ingresa un valor válido';
      valueError.classList.add('visible');
      return;
    }

    valueError.classList.remove('visible');
    const roundedValue = roundUp(rawValue, data.settings.rounding);

    const expense = {
      id: expenseToEdit?.id || generateId(),
      typeId: selectedTypeId,
      description: descInput.value.trim(),
      value: roundedValue,
      date: dateInput.value,
    };

    close();
    if (onSave) onSave(expense);
  });

  if (editing) {
    const deleteBtn = overlay.querySelector('#expense-form-delete');
    deleteBtn.addEventListener('click', () => {
      close();
      if (onSave) onSave(null, expenseToEdit.id);
    });
  }
}

function getCurrencySymbol(code) {
  const symbols = { COP: '$', USD: '$', EUR: '€', MXN: '$', ARS: '$', CLP: '$', PEN: 'S/' };
  return symbols[code] || '$';
}
