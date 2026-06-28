/**
 * Authentication and Redirection Guards Management Module
 */

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role');
}

export function getUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function logout() {
  const role = localStorage.getItem('role');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  
  if (role === 'Admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'login.html';
  }
}

// Redirects standard user if not logged in
export function checkUserAccess() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'User') {
    localStorage.clear();
    window.location.href = 'login.html?error=unauthorized';
  }
}

// Checks admin role
export function isAdminAuthenticated() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'Admin';
}
