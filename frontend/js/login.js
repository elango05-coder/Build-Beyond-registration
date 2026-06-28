import { api } from './api.js';
import { showToast, setBtnLoading } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.getElementById('google-login-btn');
  const mockBtn = document.getElementById('mock-login-btn');
  const mockInput = document.getElementById('mock-username');
  
  const devToggle = document.getElementById('dev-toggle');
  const devPanel = devToggle ? devToggle.closest('.dev-panel') : null;

  // 1. Check if returning from Google OAuth Redirect with query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const errorParam = urlParams.get('error');

  if (errorParam) {
    showToast(decodeURIComponent(errorParam), 'error');
  }

  if (token) {
    handleOAuthCallback(token);
  }

  // 2. Google OAuth Redirect Button Trigger
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      // Direct user to backend passport redirect route
      window.location.href = `http://localhost:5000/api/auth/google?redirect_uri=${encodeURIComponent(window.location.href)}`;
    });
  }

  // 3. Dev Bypass Panel Collapse Toggle
  if (devToggle && devPanel) {
    devToggle.addEventListener('click', () => {
      devPanel.classList.toggle('open');
    });
  }

  // 4. Mock Developer Login Execution
  if (mockBtn && mockInput) {
    mockBtn.addEventListener('click', async () => {
      const username = mockInput.value.trim();
      if (!username) {
        showToast('Please enter a mock username', 'warning');
        return;
      }

      setBtnLoading(mockBtn, true, 'Trigger Test Login');
      try {
        const payload = await api.post('/auth/google', {
          token: `mock_${username}`
        });

        // Store JWT token and session profiles
        localStorage.setItem('token', payload.data.token);
        localStorage.setItem('role', payload.data.user.role);
        localStorage.setItem('user', JSON.stringify(payload.data.user));

        showToast('Dev Login Successful!', 'success');

        // Check if profile is already submitted and route accordingly
        setTimeout(() => {
          routeSessionUser(payload.data.user);
        }, 1000);

      } catch (err) {
        showToast(err.message || 'Login Failed', 'error');
      } finally {
        setBtnLoading(mockBtn, false, 'Trigger Test Login');
      }
    });
  }
});

// Retrieves user details for redirect callback and routes them
async function handleOAuthCallback(jwtToken) {
  try {
    localStorage.setItem('token', jwtToken);
    
    // Fetch profile details
    const payload = await api.get('/auth/me');
    
    localStorage.setItem('role', payload.data.user.role);
    localStorage.setItem('user', JSON.stringify(payload.data.user));
    
    showToast('Login successful!', 'success');
    
    setTimeout(() => {
      routeSessionUser(payload.data.user);
    }, 1000);
  } catch (err) {
    localStorage.clear();
    showToast('OAuth session sync failed: ' + err.message, 'error');
  }
}

// Redirect decision helper
function routeSessionUser(user) {
  // If student has already registered (registrationStatus is truthy like Pending/Approved), redirect to Dashboard.
  // Otherwise, direct them to profile registration form.
  if (user.role === 'Admin') {
    window.location.href = 'admin.html';
  } else if (user.registrationStatus) {
    window.location.href = 'dashboard.html';
  } else {
    window.location.href = 'register.html';
  }
}
