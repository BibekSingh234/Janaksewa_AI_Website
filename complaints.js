document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '8000')) ? 'http://127.0.0.1:8000' : window.location.origin;
  const form = document.getElementById('complaintForm');
  const notice = document.getElementById('formMessage') || document.getElementById('complaintSuccess');
  if (!form) return;
  const nameField = document.getElementById('complaintName');
  if (nameField) nameField.value = localStorage.getItem('janaksewaUserName') || localStorage.getItem('janaksewaUserEmail') || 'Signed-in citizen';
  const getCSRFToken = () => {
    const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };
  const ensureCsrfToken = async () => {
    if (!getCSRFToken()) await fetch(`${API_BASE}/api/csrf/`, { credentials: 'include' });
  };
  const show = (text, type) => { notice.textContent = text; notice.className = notice.id === 'complaintSuccess' && type === 'success' ? 'complaint-success show' : `alert alert-${type}`; };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
    try {
      await ensureCsrfToken();
      const getValue = (id, name) => (document.getElementById(id) || form.elements[name])?.value?.trim() || '';
      const category = getValue('complaintCategory', 'category');
      const location = getValue('complaintLocation', 'location') || getValue('complaintSubject', 'location') || getValue('', 'address');
      const description = getValue('complaintDescription', 'description');
      const payload = new FormData();
      payload.append('phone', getValue('complaintPhone', 'phone'));
      payload.append('subject', location ? `${category || 'Municipal issue'}: ${location}` : (category || 'Municipal issue'));
      payload.append('ward', getValue('complaintWard', 'ward'));
      payload.append('category', category);
      payload.append('location', location);
      payload.append('description', description);
      const imageField = document.getElementById('complaintImage') || form.elements.image;
      if (imageField?.files?.[0]) payload.append('image', imageField.files[0]);

      const response = await fetch(`${API_BASE}/api/complaints/create/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCSRFToken() },
        body: payload
      });
      const data = await response.json();
      if (response.status === 401) { localStorage.clear(); window.location.replace('login-register.html'); return; }
      if (!response.ok) throw new Error(data.message || 'Unable to submit your report.');
      form.reset(); if (nameField) nameField.value = localStorage.getItem('janaksewaUserName') || 'Signed-in citizen';
      show(`Report #CMP-${data.id} submitted successfully. You can track it in My Dashboard.`, 'success');
    } catch (error) { show(error instanceof TypeError || /failed to fetch|network/i.test(error.message) ? 'Cannot reach the Janaksewa server. Start Django on port 8000 and try again.' : error.message, 'danger'); } finally { submit.disabled = false; }
  });
});
