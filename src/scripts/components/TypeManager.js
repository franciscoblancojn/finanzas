import { generateId } from '../helpers.js';

export function renderTypeSelector(container, types, selectedId, onChange) {
  container.innerHTML = `
    <div class="type-list">
      ${types.map(t => `
        <button class="type-tag ${t.id === selectedId ? 'selected' : ''}" data-id="${t.id}">
          <span>${t.icon}</span>
          <span>${t.name}</span>
        </button>
      `).join('')}
      <button class="type-tag" id="add-type-btn" style="border: 1.5px dashed var(--text-muted); color: var(--text-muted);">
        <span>+</span>
        <span>Nuevo</span>
      </button>
    </div>
  `;

  container.querySelectorAll('.type-tag[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      onChange(btn.dataset.id);
    });
  });

  const addBtn = container.querySelector('#add-type-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showTypeForm(types, (newTypes) => {
        onChange(newTypes[newTypes.length - 1].id);
      });
    });
  }
}

export function showTypeForm(types, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">${'Nuevo tipo de gasto'}</div>
        <button class="modal-close" id="type-form-close">✕</button>
      </div>
      <form id="type-form">
        <div class="form-group">
          <label class="form-label">Icono (emoji)</label>
          <input class="form-input" id="type-icon" value="📌" maxlength="2" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" id="type-name" placeholder="Ej: Comida, Transporte..." required>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" id="type-form-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </div>
      </form>
      <div style="margin-top: 16px;">
        <label class="form-label">Tipos existentes</label>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
          ${types.map(t => `
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--bg-tertiary); border-radius: 16px; font-size: 0.85rem;">
              ${t.icon} ${t.name}
              <button class="type-tag-edit" data-id="${t.id}" title="Eliminar">✕</button>
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('#type-form');
  const iconInput = overlay.querySelector('#type-icon');
  const nameInput = overlay.querySelector('#type-name');

  function close() {
    overlay.remove();
  }

  overlay.querySelector('#type-form-close').addEventListener('click', close);
  overlay.querySelector('#type-form-cancel').addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelectorAll('.type-tag-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const updatedTypes = types.filter(t => t.id !== id);
      if (updatedTypes.length === 0) return;
      types.length = 0;
      types.push(...updatedTypes);
      close();
      showTypeForm(types, onSave);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const icon = iconInput.value.trim();
    const name = nameInput.value.trim();
    if (!icon || !name) return;

    const newType = { id: generateId(), icon, name };
    types.push(newType);
    close();
    if (onSave) onSave(types);
  });
}
