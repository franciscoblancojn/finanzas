export function showToast(message, type = 'info', duration = 3000, actions = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  toast.appendChild(msgSpan);

  if (actions) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = actions.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      actions.onClick();
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    });
    toast.appendChild(btn);
    duration = Math.max(duration, 5000);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
