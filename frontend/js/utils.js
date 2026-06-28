/**
 * Frontend Utility Functions (Modals, Toasts, Spinners)
 */

// Toast Notifications Helper
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;

  // Auto remove after 5 seconds
  const autoRemove = setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 5000);

  // Close button trigger
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(autoRemove);
    toast.remove();
  });

  container.appendChild(toast);
}

// Button loading state toggler
export function setBtnLoading(btn, isLoading, originalText = 'Submit') {
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `
      <span class="spinner"></span> Loading...
    `;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.original || originalText;
  }
}

// HTML5 modal triggers
export function initModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;

  const closeBtns = modal.querySelectorAll('[data-close]');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  return {
    show: () => modal.classList.add('active'),
    hide: () => modal.classList.remove('active')
  };
}
