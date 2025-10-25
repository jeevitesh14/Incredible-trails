// public/auth.js
async function postJSON(url, data) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return resp.json().then(j => ({ status: resp.status, body: j }));
}

function showMessage(el, text, isError) {
  el.textContent = text;
  el.style.color = isError ? 'crimson' : 'green';
}

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const msg = document.getElementById('msg');

      const { status, body } = await postJSON('/api/register', { name, email, password });
      if (status >= 200 && status < 300) {
        // save token and redirect (or show success)
        localStorage.setItem('token', body.token);
        showMessage(msg, 'Registered successfully — redirecting...', false);
        setTimeout(() => window.location.href = '/', 900);
      } else {
        showMessage(msg, body.error || 'Registration failed', true);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const msg = document.getElementById('msg');

      const { status, body } = await postJSON('/api/login', { email, password });
      if (status >= 200 && status < 300) {
        localStorage.setItem('token', body.token);
        showMessage(msg, 'Login successful — redirecting...', false);
        setTimeout(() => window.location.href = '/', 800);
      } else {
        showMessage(msg, body.error || 'Login failed', true);
      }
    });
  }
});
