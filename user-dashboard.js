document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '8000')) ? 'http://127.0.0.1:8000' : window.location.origin;
  const apiFetch = (url, options = {}) => fetch(url, { credentials: 'include', ...options });
  const message = document.getElementById('dashboardMessage');
  async function verifySession() {
    try {
      const response = await apiFetch(`${API_BASE}/api/me/`);
      if (!response.ok) throw new Error('Unauthenticated');
      const result = await response.json();
      if (!result.success) throw new Error('Unauthenticated');
      const user = result.data;
      if (user.role === 'admin') {
        window.location.replace('admin-dashboard.html');
        return false;
      }
      document.getElementById('userName').textContent = user.name || 'Citizen';
      localStorage.setItem('janaksewaAuth', 'true');
      localStorage.setItem('janaksewaRole', user.role || 'user');
      localStorage.setItem('janaksewaUserName', user.name || 'Citizen');
      localStorage.setItem('janaksewaUserEmail', user.email || '');
      return true;
    } catch {
      localStorage.clear();
      window.location.replace('login-register.html');
      return false;
    }
  }
  const showError = (text) => { message.textContent = text; message.className = 'alert alert-danger'; };
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  async function load() {
    try {
      const [statsResponse, reportsResponse] = await Promise.all([apiFetch(`${API_BASE}/api/dashboard/my-stats/`), apiFetch(`${API_BASE}/api/complaints/mine/`)]);
      if (statsResponse.status === 401 || reportsResponse.status === 401) { localStorage.clear(); window.location.replace('login-register.html'); return; }
      const stats = await statsResponse.json(); const reports = await reportsResponse.json();
      if (!statsResponse.ok || !reportsResponse.ok) throw new Error(stats.message || reports.message || 'Could not load dashboard data.');
      const data = stats.data; document.getElementById('totalCount').textContent = data.complaints; document.getElementById('pendingCount').textContent = data.pending; document.getElementById('processingCount').textContent = data.processing; document.getElementById('resolvedCount').textContent = data.resolved;
      const rows = reports.data.map(item => `<tr><td><strong>#CMP-${item.id}</strong><br><small>${escapeHtml(item.subject)}</small></td><td>${escapeHtml(item.category)}<br><small>Ward: ${escapeHtml(item.ward || 'Not provided')}</small></td><td>${escapeHtml(item.created_at)}</td><td><span class="status status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td><td><button class="btn btn-sm btn-light" data-bs-toggle="tooltip" title="${escapeHtml(item.description)}">View</button></td></tr>`).join('');
      document.getElementById('complaintsBody').innerHTML = rows || '<tr><td colspan="5" class="text-center text-secondary py-5">You have not submitted a report yet.</td></tr>';
    } catch (error) { showError(error.message); }
  }
  document.getElementById('refreshButton').addEventListener('click', load);
  document.getElementById('logoutButton').addEventListener('click', async () => { try { const csrf = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/); if (!csrf) await apiFetch(`${API_BASE}/api/csrf/`); const token = (document.cookie.match(/(?:^|; )csrftoken=([^;]+)/) || [])[1] || ''; await apiFetch(`${API_BASE}/api/logout/`, { method: 'POST', headers: { 'X-CSRFToken': decodeURIComponent(token) } }); } finally { localStorage.clear(); window.location.href = 'login-register.html'; } });
  verifySession().then((ok) => { if (ok) load(); });
});
