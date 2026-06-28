import { api } from './api.js';
import { isAdminAuthenticated, logout } from './auth.js';
import { showToast, setBtnLoading, initModal } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginCard = document.getElementById('admin-login-card');
  const dashboardView = document.getElementById('admin-dashboard-view');
  
  const loginForm = document.getElementById('admin-login-form');
  const emailInput = document.getElementById('admin-email');
  const passwordInput = document.getElementById('admin-password');
  const btnLogin = document.getElementById('btn-admin-login');
  
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  const listRows = document.getElementById('registrants-list-rows');
  const searchInput = document.getElementById('admin-search-input');
  const btnSearch = document.getElementById('btn-admin-search');
  
  // Stats
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statApproved = document.getElementById('stat-approved');
  const statRejected = document.getElementById('stat-rejected');
  const statPresent = document.getElementById('stat-present');
  
  // Modal Elements
  const modalEl = document.getElementById('review-modal');
  const modalProfileDetails = document.getElementById('modal-profile-details');
  const modalProfileActions = document.getElementById('modal-profile-actions');
  
  let modalInstance = null;
  let currentFilter = 'All';

  // Initialize: Check Admin Session
  if (isAdminAuthenticated()) {
    if (loginCard) loginCard.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    
    // Setup Modal instance
    modalInstance = initModal('review-modal');
    
    // Boot Dashboard stats and list
    loadDashboardStats();
    loadRegistrants('All');
  } else {
    if (loginCard) loginCard.style.display = 'flex';
    if (dashboardView) dashboardView.style.display = 'none';
  }

  // Admin Logout Trigger
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', logout);
  }

  // Admin Credentials Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showToast('Please enter both email and password.', 'warning');
        return;
      }

      setBtnLoading(btnLogin, true, 'Authenticate Console');
      try {
        const res = await api.post('/admin/login', { email, password });
        
        // Store JWT
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.admin.role);
        localStorage.setItem('user', JSON.stringify(res.data.admin));

        showToast('Admin access authenticated.', 'success');

        // Toggle layout views
        if (loginCard) loginCard.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'block';
        modalInstance = initModal('review-modal');

        // Load stats
        loadDashboardStats();
        loadRegistrants('All');
      } catch (err) {
        showToast(err.message || 'Authentication Failed', 'error');
      } finally {
        setBtnLoading(btnLogin, false, 'Authenticate Console');
      }
    });
  }

  // Load Dashboard Statistics Counts
  async function loadDashboardStats() {
    try {
      const res = await api.get('/admin/dashboard');
      const stats = res.data.stats;

      if (statTotal) statTotal.innerText = stats.totalRegistrations;
      if (statPending) statPending.innerText = stats.pending;
      if (statApproved) statApproved.innerText = stats.approved;
      if (statRejected) statRejected.innerText = stats.rejected;
      if (statPresent) statPresent.innerText = stats.present;
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  }

  // Load Registrants List based on filters
  async function loadRegistrants(filter) {
    currentFilter = filter;
    if (listRows) listRows.innerHTML = `<tr><td colspan="6" class="text-center">Fetching ${filter.toLowerCase()} applications...</td></tr>`;

    try {
      let registrants = [];
      
      if (filter === 'Pending') {
        const res = await api.get('/admin/pending');
        registrants = res.data.registrations;
      } else if (filter === 'Approved') {
        const res = await api.get('/admin/approved');
        registrants = res.data.registrations;
      } else if (filter === 'Rejected') {
        const res = await api.get('/admin/rejected');
        registrants = res.data.registrations;
      } else {
        // All: Merge pending + approved + rejected for full list view
        const resPending = await api.get('/admin/pending');
        const resApproved = await api.get('/admin/approved');
        const resRejected = await api.get('/admin/rejected');
        
        registrants = [
          ...resPending.data.registrations,
          ...resApproved.data.registrations,
          ...resRejected.data.registrations
        ];
      }

      renderTableRows(registrants);
    } catch (err) {
      showToast('Failed to load application rows: ' + err.message, 'error');
      if (listRows) listRows.innerHTML = `<tr><td colspan="6" class="text-center text-neon-pink">Error loading rows.</td></tr>`;
    }
  }

  // Render rows inside DOM
  function renderTableRows(users) {
    if (!listRows) return;
    if (users.length === 0) {
      listRows.innerHTML = `<tr><td colspan="6" class="text-center">No registrants found matching this list filter.</td></tr>`;
      return;
    }

    listRows.innerHTML = '';
    users.forEach(user => {
      const tr = document.createElement('tr');
      const statusClass = user.registrationStatus ? user.registrationStatus.toLowerCase() : 'unregistered';
      
      tr.innerHTML = `
        <td><strong>${user.name}</strong></td>
        <td>
          <div style="font-size:0.85rem;font-weight:600;">${user.registerNumber || 'N/A'}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${user.email}</div>
        </td>
        <td>${user.department || '-'} | Yr ${user.year || '-'}</td>
        <td>${user.participationType || 'N/A'}</td>
        <td>
          <span class="table-status-tag ${statusClass}">
            ${user.registrationStatus || 'Not Submitted'}
          </span>
        </td>
        <td>
          <div class="action-btns-wrapper">
            <button class="btn-table-action review" data-id="${user._id}">Review</button>
            ${user.registrationStatus === 'Pending' ? `
              <button class="btn-table-action approve" data-id="${user._id}">Approve</button>
              <button class="btn-table-action reject" data-id="${user._id}">Reject</button>
            ` : ''}
          </div>
        </td>
      `;

      // Bind actions
      tr.querySelector('.review').addEventListener('click', () => openProfileReview(user));
      
      const approveBtn = tr.querySelector('.approve');
      if (approveBtn) {
        approveBtn.addEventListener('click', () => handleRegistrationAction(user._id, 'approve'));
      }
      
      const rejectBtn = tr.querySelector('.reject');
      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => handleRegistrationAction(user._id, 'reject'));
      }

      listRows.appendChild(tr);
    });
  }

  // Handle Approve / Reject triggers
  async function handleRegistrationAction(userId, action) {
    try {
      const endpoint = `/admin/${action}/${userId}`;
      const res = await api.post(endpoint, {});
      showToast(res.message, 'success');
      
      // Reload stats and list
      loadDashboardStats();
      loadRegistrants(currentFilter);
      
      if (modalInstance) modalInstance.hide();
    } catch (err) {
      showToast(err.message || `Action failed`, 'error');
    }
  }

  // Open Custom Profile Modal Review
  function openProfileReview(user) {
    if (!modalInstance) return;

    modalProfileDetails.innerHTML = `
      <div class="modal-profile-grid">
        <div class="modal-profile-item">
          <span class="label">Full Name</span>
          <span class="value">${user.name}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Email Address</span>
          <span class="value">${user.email}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Register Number</span>
          <span class="value">${user.registerNumber || '-'}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Phone Number</span>
          <span class="value">${user.phone || '-'}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Department</span>
          <span class="value">${user.department || '-'}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Year of Study</span>
          <span class="value">${user.year ? `${user.year} Year` : '-'}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Participation</span>
          <span class="value">${user.participationType || '-'}</span>
        </div>
        <div class="modal-profile-item">
          <span class="label">Attendance Status</span>
          <span class="value text-neon-cyan">${user.isPresent ? 'Present (Checked In)' : 'Absent'}</span>
        </div>
      </div>
      <div class="modal-profile-links-list">
        <h4>Social Profile Portals</h4>
        ${user.github ? `<a href="${user.github}" target="_blank">🐙 GitHub Profile: ${user.github}</a>` : '<p>No GitHub link.</p>'}
        ${user.linkedin ? `<a href="${user.linkedin}" target="_blank">💼 LinkedIn Profile: ${user.linkedin}</a>` : '<p>No LinkedIn link.</p>'}
        ${user.portfolio ? `<a href="${user.portfolio}" target="_blank">🌐 Personal Portfolio: ${user.portfolio}</a>` : '<p>No Portfolio link.</p>'}
      </div>
    `;

    // Footer actions
    if (user.registrationStatus === 'Pending') {
      modalProfileActions.innerHTML = `
        <button type="button" class="btn-table-action reject" style="padding:10px 20px; font-size:0.85rem;" id="modal-reject-btn">Reject Registration</button>
        <button type="button" class="btn-table-action approve" style="padding:10px 20px; font-size:0.85rem;" id="modal-approve-btn">Approve Registration</button>
      `;

      document.getElementById('modal-approve-btn').addEventListener('click', () => handleRegistrationAction(user._id, 'approve'));
      document.getElementById('modal-reject-btn').addEventListener('click', () => handleRegistrationAction(user._id, 'reject'));
    } else {
      modalProfileActions.innerHTML = `
        <span style="font-size:0.85rem;color:var(--text-muted);">Status evaluated: <strong>${user.registrationStatus}</strong></span>
        <button type="button" class="btn-cyber btn-cyber-purple" data-close style="padding:8px 16px;font-size:0.8rem;">Close</button>
      `;
      // Re-bind close close click
      modalProfileActions.querySelector('[data-close]').addEventListener('click', () => modalInstance.hide());
    }

    modalInstance.show();
  }

  // Filter Tabs Event triggers
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadRegistrants(tab.dataset.filter);
    });
  });

  // Search logic API hook
  if (btnSearch && searchInput) {
    const triggerSearch = async () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        loadRegistrants(currentFilter);
        return;
      }

      listRows.innerHTML = `<tr><td colspan="6" class="text-center">Searching "${keyword}"...</td></tr>`;
      try {
        const res = await api.get(`/admin/search/users?query=${encodeURIComponent(keyword)}`);
        renderTableRows(res.data.users);
      } catch (err) {
        showToast('Search request failed: ' + err.message, 'error');
      }
    };

    btnSearch.addEventListener('click', triggerSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });
  }
});
