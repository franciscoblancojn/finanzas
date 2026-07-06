export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-overlay');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const cancelBtn = document.getElementById('confirm-cancel');
    const confirmBtn = document.getElementById('confirm-ok');

    if (!overlay || !titleEl || !messageEl || !cancelBtn || !confirmBtn) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.add('open');

    function cleanup() {
      overlay.classList.remove('open');
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onConfirm);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function onConfirm() {
      cleanup();
      resolve(true);
    }

    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
  });
}
