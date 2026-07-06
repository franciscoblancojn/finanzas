import { roundUp } from '../helpers.js';

export function showIncomeModal(data, year, month, onSave) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open income-modal-overlay';
    overlay.id = 'income-modal';
    overlay.style.zIndex = '250';

    const currencySymbol = getCurrencySymbol(data.settings.currency);

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">💰 Registrar Ingreso</div>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">
          Este mes aún no tiene ingresos registrados. Por favor, registra tu ingreso mensual para continuar.
        </p>
        <form id="income-form">
          <div class="form-group">
            <label class="form-label">Ingreso mensual</label>
            <div class="money-input-group">
              <span class="currency-symbol">${currencySymbol}</span>
              <input class="form-input" id="income-value" type="number" step="1" min="1" placeholder="0" autofocus required>
            </div>
            <div id="income-value-error" class="form-error"></div>
          </div>
          <div class="form-group">
            <label class="form-label">
              <span>Ahorro inicial</span>
              <span style="font-weight: 400; color: var(--text-muted); font-size: 0.8rem;"> (no descuenta del balance)</span>
            </label>
            <div class="money-input-group">
              <span class="currency-symbol">${currencySymbol}</span>
              <input class="form-input" id="income-savings" type="number" step="1" min="0" placeholder="0" value="0">
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 8px;">
            Guardar y comenzar
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector('#income-form');
    const valueInput = overlay.querySelector('#income-value');
    const savingsInput = overlay.querySelector('#income-savings');
    const valueError = overlay.querySelector('#income-value-error');

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // Prevent closing by clicking outside - it's mandatory
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const rawValue = parseFloat(valueInput.value);
      if (isNaN(rawValue) || rawValue <= 0) {
        valueError.textContent = 'Ingresa un valor válido';
        valueError.classList.add('visible');
        return;
      }

      valueError.classList.remove('visible');
      const income = roundUp(rawValue, data.settings.rounding);
      const savings = roundUp(parseFloat(savingsInput.value) || 0, data.settings.rounding);

      overlay.remove();
      if (onSave) onSave(income, savings);
      resolve({ income, savings });
    });
  });
}

function getCurrencySymbol(code) {
  const symbols = { COP: '$', USD: '$', EUR: '€', MXN: '$', ARS: '$', CLP: '$', PEN: 'S/' };
  return symbols[code] || '$';
}
