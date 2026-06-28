/**
 * Reusable Fetch API Module for Backend API Communication
 */

const API_BASE = "http://localhost:5000/api";

// Base request wrapper injecting JWT headers and handling redirection on 401
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Set headers
  options.headers = options.headers || {};
  options.headers['Content-Type'] = 'application/json';
  
  // Inject JWT from localStorage
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, options);
    
    // Auto-redirect if unauthorized (401)
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      
      const currentPath = window.location.pathname;
      if (currentPath.includes('admin.html')) {
        // Reload admin to trigger admin credential panel
        window.location.reload();
      } else if (!currentPath.includes('login.html') && !currentPath.includes('index.html')) {
        // Redirect standard user to user login portal
        window.location.href = 'login.html?error=session_expired';
      }
    }

    const payload = await res.json();
    
    if (!res.ok) {
      const err = new Error(payload.message || 'API request failed');
      err.status = res.status;
      err.errors = payload.errors || [];
      throw err;
    }
    
    return payload;
  } catch (error) {
    console.error(`[API Error] Path: ${endpoint} | Error:`, error);
    throw error;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
