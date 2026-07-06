import { formatMoney, getMonthName } from '../helpers.js';
import { calculateBalance, getMonthData } from '../storage.js';
import { COLORS } from '../constants.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

let chartInstances = [];

function destroyCharts() {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
}

export function renderAnalytics(container, data) {
  destroyCharts();
  const currency = data.settings.currency;
  const typeMap = {};
  data.expenseTypes.forEach(t => { typeMap[t.id] = t; });

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  const yearlyData = {};
  const monthlyLabels = [];
  const monthlyIncomeData = [];
  const monthlyExpenseData = [];
  const monthlySavingsData = [];
  const monthlyBalanceData = [];
  const categoryTotals = {};
  const savingsEvolution = [];

  const sortedMonths = Object.keys(data.months).sort();
  let runningSavings = 0;

  sortedMonths.forEach(key => {
    const [y, m] = key.split('-').map(Number);
    const md = data.months[key];
    const expTotal = md.expenses.reduce((s, e) => s + e.value, 0);
    const balance = calculateBalance(data, y, m - 1);

    totalIncome += md.income || 0;
    totalExpenses += expTotal;
    totalSavings += md.savings || 0;
    runningSavings += md.savings || 0;

    const yearKey = String(y);
    if (!yearlyData[yearKey]) yearlyData[yearKey] = { income: 0, expenses: 0, savings: 0, balance: 0, count: 0 };
    yearlyData[yearKey].income += md.income || 0;
    yearlyData[yearKey].expenses += expTotal;
    yearlyData[yearKey].savings += md.savings || 0;
    yearlyData[yearKey].count++;

    monthlyLabels.push(`${getMonthName(m)} ${y}`);
    monthlyIncomeData.push(md.income || 0);
    monthlyExpenseData.push(expTotal);
    monthlySavingsData.push(md.savings || 0);
    monthlyBalanceData.push(balance);
    savingsEvolution.push(runningSavings);

    md.expenses.forEach(e => {
      const type = typeMap[e.typeId];
      const catName = type ? type.name : 'Otros';
      if (!categoryTotals[catName]) categoryTotals[catName] = 0;
      categoryTotals[catName] += e.value;
    });
  });

  const overallBalance = totalIncome - totalExpenses + totalSavings;

  container.innerHTML = `
    <div class="analytics-container">
      <div class="analytics-grid">
        <div class="stat-card">
          <div class="stat-card-label">Ingresos totales</div>
          <div class="stat-card-value positive">${formatMoney(totalIncome, currency)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Gastos totales</div>
          <div class="stat-card-value negative">${formatMoney(totalExpenses, currency)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Ahorro total</div>
          <div class="stat-card-value" style="color: var(--accent)">${formatMoney(totalSavings, currency)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Balance global</div>
          <div class="stat-card-value ${overallBalance >= 0 ? 'positive' : 'negative'}">
            ${formatMoney(overallBalance, currency)}
          </div>
        </div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-title">Ingresos vs Gastos por Mes</div>
        <div class="chart-container"><canvas id="chart-income-expense"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-title">Evolución del Balance</div>
        <div class="chart-container"><canvas id="chart-balance"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-title">Evolución del Ahorro</div>
        <div class="chart-container"><canvas id="chart-savings"></canvas></div>
      </div>

      <div class="analytics-card">
        <div class="analytics-card-title">Gastos por Categoría</div>
        <div class="chart-container"><canvas id="chart-categories"></canvas></div>
      </div>

      ${Object.keys(yearlyData).length > 1 ? `
      <div class="analytics-card">
        <div class="analytics-card-title">Comparación Anual</div>
        <div class="chart-container"><canvas id="chart-yearly"></canvas></div>
      </div>` : ''}
    </div>
  `;

  // Chart: Income vs Expense
  if (monthlyLabels.length > 0) {
    const ctx1 = document.getElementById('chart-income-expense');
    if (ctx1) {
      chartInstances.push(new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: monthlyLabels,
          datasets: [
            { label: 'Ingresos', data: monthlyIncomeData, backgroundColor: '#2ecc71', borderRadius: 4 },
            { label: 'Gastos', data: monthlyExpenseData, backgroundColor: '#e74c3c', borderRadius: 4 },
            { label: 'Ahorro', data: monthlySavingsData, backgroundColor: '#6c63ff', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } },
          },
        },
      }));
    }

    // Chart: Balance evolution
    const ctx2 = document.getElementById('chart-balance');
    if (ctx2) {
      chartInstances.push(new Chart(ctx2, {
        type: 'line',
        data: {
          labels: monthlyLabels,
          datasets: [{
            label: 'Balance',
            data: monthlyBalanceData,
            borderColor: '#6c63ff',
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } },
          },
        },
      }));
    }

    // Chart: Savings evolution
    const ctx3 = document.getElementById('chart-savings');
    if (ctx3) {
      chartInstances.push(new Chart(ctx3, {
        type: 'line',
        data: {
          labels: monthlyLabels,
          datasets: [{
            label: 'Ahorro acumulado',
            data: savingsEvolution,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } },
          },
        },
      }));
    }

    // Chart: Categories doughnut
    const ctx4 = document.getElementById('chart-categories');
    if (ctx4 && Object.keys(categoryTotals).length > 0) {
      const sortedCats = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      const colors = sortedCats.map((_, i) => COLORS[i % COLORS.length]);

      chartInstances.push(new Chart(ctx4, {
        type: 'doughnut',
        data: {
          labels: sortedCats.map(([name]) => name),
          datasets: [{
            data: sortedCats.map(([, val]) => val),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: 'var(--bg-secondary)',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
            },
          },
        },
      }));
    }

    // Chart: Yearly comparison
    if (Object.keys(yearlyData).length > 1) {
      const ctx5 = document.getElementById('chart-yearly');
      if (ctx5) {
        const years = Object.keys(yearlyData).sort();
        chartInstances.push(new Chart(ctx5, {
          type: 'bar',
          data: {
            labels: years,
            datasets: [
              { label: 'Ingresos', data: years.map(y => yearlyData[y].income), backgroundColor: '#2ecc71', borderRadius: 4 },
              { label: 'Gastos', data: years.map(y => yearlyData[y].expenses), backgroundColor: '#e74c3c', borderRadius: 4 },
              { label: 'Ahorro', data: years.map(y => yearlyData[y].savings), backgroundColor: '#6c63ff', borderRadius: 4 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
              x: { grid: { display: false } },
            },
          },
        }));
      }
    }
  } else {
    container.querySelector('.analytics-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">Registra algunos meses para ver estadísticas</div>
      </div>
    `;
  }
}
