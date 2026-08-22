function formatPrice(amount) {
  return '₹' + Math.round(parseFloat(amount) || 0).toLocaleString('en-IN');
}

function escapeHtml(str) {
  if (str == null) return '';

  const div = document.createElement('div');
  div.textContent = String(str);

  return div.innerHTML;
}

function getUserStorageKey(base) {
  try {
    const rawUser = localStorage.getItem('dtf_user') || localStorage.getItem('user');
    const user = JSON.parse(rawUser || 'null');
    return user && user.email ? `${base}_${user.email.toLowerCase()}` : base;
  } catch {
    return base;
  }
}

window.formatPrice = formatPrice;
window.escapeHtml = escapeHtml;
window.getUserStorageKey = getUserStorageKey;

