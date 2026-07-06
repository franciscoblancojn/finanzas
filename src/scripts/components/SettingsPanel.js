import { CURRENCIES, ROUNDING_OPTIONS } from '../constants.js';
import { exportData, importData, resetData } from '../storage.js';
import { showToast } from './Toast.js';
import { showConfirm } from './ConfirmDialog.js';

export function renderSettings(container, data, onChange) {
  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-group">
        <div class="settings-group-title">Configuración</div>

        <div class="settings-item">
          <div>
            <div class="settings-item-label">Moneda</div>
            <div class="settings-item-desc">Formato monetario de toda la app</div>
          </div>
          <div class="select-wrapper" style="width: 120px;">
            <select id="setting-currency">
              ${Object.entries(CURRENCIES).map(([code, c]) =>
                `<option value="${code}" ${code === data.settings.currency ? 'selected' : ''}>${code} ${c.symbol}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="settings-item">
          <div>
            <div class="settings-item-label">Redondeo</div>
            <div class="settings-item-desc">Redondeo hacia arriba de todos los valores</div>
          </div>
          <div class="select-wrapper" style="width: 120px;">
            <select id="setting-rounding">
              ${ROUNDING_OPTIONS.map(r =>
                `<option value="${r}" ${r === data.settings.rounding ? 'selected' : ''}>${r === 0.01 ? '0.01¢' : formatRounding(r)}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="settings-item">
          <div>
            <div class="settings-item-label">Tema oscuro</div>
            <div class="settings-item-desc">Cambiar entre tema claro y oscuro</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="setting-theme" ${data.settings.theme === 'dark' ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Ahorro acumulado</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Total ahorrado</div>
            <div class="settings-item-desc">Ahorro acumulado de todos los meses</div>
          </div>
          <div style="font-weight: 700; color: var(--accent); font-size: 1.1rem;">
            ${formatCurrency(data.accumulatedSavings, data.settings.currency)}
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Datos</div>

        <button class="btn btn-secondary btn-block" id="btn-install" style="margin-bottom: 8px; display: none;">
          📲 Instalar aplicación
        </button>
        <button class="btn btn-secondary btn-block" id="btn-export" style="margin-bottom: 8px;">
          📤 Exportar respaldo
        </button>
        <button class="btn btn-secondary btn-block" id="btn-import" style="margin-bottom: 8px;">
          📥 Importar respaldo
        </button>
        <input type="file" id="import-file-input" accept=".json" style="display:none">
        <button class="btn btn-danger btn-block" id="btn-reset">
          🗑️ Reiniciar todos los datos
        </button>
      </div>
    </div>
  `;

  // Currency change
  const currencySelect = container.querySelector('#setting-currency');
  currencySelect.addEventListener('change', () => {
    data.settings.currency = currencySelect.value;
    onChange(data);
    showToast('Moneda actualizada', 'success');
  });

  // Rounding change
  const roundingSelect = container.querySelector('#setting-rounding');
  roundingSelect.addEventListener('change', () => {
    data.settings.rounding = parseFloat(roundingSelect.value);
    onChange(data);
    showToast('Redondeo actualizado', 'success');
  });

  // Theme toggle
  const themeToggle = container.querySelector('#setting-theme');
  themeToggle.addEventListener('change', () => {
    data.settings.theme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(data.settings.theme);
    onChange(data);
    showToast(themeToggle.checked ? 'Tema oscuro activado' : 'Tema claro activado', 'success');
  });

  // Install app
  const installBtn = container.querySelector('#btn-install');
  function updateInstallBtn() {
    installBtn.style.display = window.deferredInstallPrompt ? 'flex' : 'none';
  }
  updateInstallBtn();
  document.addEventListener('install-ready', updateInstallBtn);
  installBtn.addEventListener('click', async () => {
    const prompt = window.deferredInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    window.deferredInstallPrompt = null;
    updateInstallBtn();
    showToast(result.outcome === 'accepted' ? 'App instalada' : 'Instalación cancelada', 'info');
  });

  // Export
  container.querySelector('#btn-export').addEventListener('click', () => {
    exportData(data);
    if (window.AndroidExporter) {
      showToast('Respaldo exportado', 'success', 5000, {
        label: 'Ver archivo',
        onClick: () => window.AndroidExporter.openDownloads(),
      });
    } else {
      showToast('Respaldo exportado', 'success');
    }
  });

  // Import
  container.querySelector('#btn-import').addEventListener('click', () => {
    container.querySelector('#import-file-input').click();
  });

  container.querySelector('#import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const confirmed = await showConfirm('Importar datos', '¿Seguro que quieres importar? Los datos actuales serán reemplazados.');
      if (!confirmed) return;
      const newData = await importData(file);
      Object.assign(data, newData);
      applyTheme(data.settings.theme);
      onChange(data);
      showToast('Datos importados correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  });

  // Reset
  container.querySelector('#btn-reset').addEventListener('click', async () => {
    const confirmed = await showConfirm('Reiniciar datos', '¿Seguro que quieres eliminar todos los datos? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    const freshData = resetData();
    Object.assign(data, freshData);
    applyTheme(data.settings.theme);
    onChange(data);
    showToast('Datos reiniciados', 'info');
  });
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function formatRounding(value) {
  if (value >= 1000) return `${value / 1000}k`;
  return String(value);
}

function formatCurrency(value, code) {
  const c = CURRENCIES[code] || CURRENCIES.COP;
  try {
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${c.symbol}${value.toLocaleString()}`;
  }
}
