import { MONTHS } from '../constants.js';

export function renderCalendarNav(container, data, year, month, onChange) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 10; y--) {
    years.push(y);
  }

  container.innerHTML = `
    <div class="calendar-nav">
      <div class="calendar-nav-selects">
        <div class="select-wrapper">
          <select id="month-select">
            ${MONTHS.map((m, i) =>
              `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="select-wrapper">
          <select id="year-select">
            ${years.map(y =>
              `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    </div>
  `;

  const monthSelect = container.querySelector('#month-select');
  const yearSelect = container.querySelector('#year-select');

  monthSelect.addEventListener('change', () => {
    onChange(Number(monthSelect.value), Number(yearSelect.value));
  });

  yearSelect.addEventListener('change', () => {
    onChange(Number(monthSelect.value), Number(yearSelect.value));
  });
}
