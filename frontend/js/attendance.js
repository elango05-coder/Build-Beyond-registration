import { api } from './api.js';
import { isAdminAuthenticated } from './auth.js';
import { showToast, setBtnLoading } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Enforce admin access redirection
  if (!isAdminAuthenticated()) {
    showToast('Admin session required. Redirecting...', 'warning');
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1200);
    return;
  }

  // Elements
  const qrInput = document.getElementById('qr-input');
  const btnVerify = document.getElementById('btn-simulate-scan');
  
  const emptyView = document.getElementById('scan-empty-view');
  const profileView = document.getElementById('scan-profile-view');
  
  const scanName = document.getElementById('scan-user-name');
  const scanEmail = document.getElementById('scan-user-email');
  const scanReg = document.getElementById('scan-user-reg');
  const scanDept = document.getElementById('scan-user-dept');
  const scanYear = document.getElementById('scan-user-year');
  const scanType = document.getElementById('scan-user-type');
  const scanTeamRow = document.getElementById('scan-team-row');
  const scanTeamName = document.getElementById('scan-team-name');
  const scanStatus = document.getElementById('scan-user-status');
  const scanAttendance = document.getElementById('scan-attendance-status');
  
  const btnMarkPresent = document.getElementById('btn-mark-present');

  let activeScannedToken = '';

  // 2. Simulating scanning via text input click or keypress
  const triggerScanVerification = async () => {
    const tokenVal = qrInput.value.trim();
    if (!tokenVal) {
      showToast('Please enter a scanned QR pass token UUID', 'warning');
      return;
    }

    setBtnLoading(btnVerify, true, 'Verify QR');
    try {
      const res = await api.post('/attendance/scan', { token: tokenVal });
      const user = res.data.user;

      activeScannedToken = tokenVal;
      showToast('QR verified successfully', 'success');

      // Populate card fields
      if (scanName) scanName.innerText = user.name;
      if (scanEmail) scanEmail.innerText = user.email;
      if (scanReg) scanReg.innerText = user.registerNumber || '-';
      if (scanDept) scanDept.innerText = user.department || '-';
      if (scanYear) scanYear.innerText = user.year ? `${user.year} Year` : '-';
      if (scanType) scanType.innerText = user.participationType || 'Individual';

      if (user.participationType === 'Team' && user.team) {
        if (scanTeamName) scanTeamName.innerText = user.team.teamName || '-';
        if (scanTeamRow) scanTeamRow.style.display = 'flex';
      } else {
        if (scanTeamRow) scanTeamRow.style.display = 'none';
      }

      // Statuses
      if (scanStatus) {
        scanStatus.className = 'status-badge status-approved';
        scanStatus.innerText = user.registrationStatus;
      }

      updateAttendanceBadge(user.isPresent);

      // Toggle views
      if (emptyView) emptyView.classList.add('hidden');
      if (profileView) profileView.classList.add('active');

      // Enable mark button if they are not already present
      if (btnMarkPresent) {
        btnMarkPresent.disabled = user.isPresent;
      }

    } catch (err) {
      showToast(err.message || 'QR Verification failed', 'error');
      resetScannerProfile();
    } finally {
      setBtnLoading(btnVerify, false, 'Verify QR');
    }
  };

  if (btnVerify) {
    btnVerify.addEventListener('click', triggerScanVerification);
  }

  if (qrInput) {
    qrInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') triggerScanVerification();
    });
  }

  // 3. Mark attendance check-in trigger
  if (btnMarkPresent) {
    btnMarkPresent.addEventListener('click', async () => {
      if (!activeScannedToken) {
        showToast('No active scanned token linked', 'warning');
        return;
      }

      setBtnLoading(btnMarkPresent, true, 'Mark Participant Present');
      try {
        const res = await api.post('/attendance/mark', { token: activeScannedToken });

        if (res.success) {
          showToast('Attendance logged successfully!', 'success');
          updateAttendanceBadge(true);
          if (btnMarkPresent) btnMarkPresent.disabled = true;
        } else if (res.message === 'Already Present') {
          showToast('Scan Rejected: Already Present', 'error');
          updateAttendanceBadge(true);
          if (btnMarkPresent) btnMarkPresent.disabled = true;
        } else {
          showToast(res.message || 'Action failed', 'warning');
        }
      } catch (err) {
        showToast(err.message || 'Check-in failed', 'error');
      } finally {
        setBtnLoading(btnMarkPresent, false, 'Mark Participant Present');
      }
    });
  }

  // Helper status badge updater
  function updateAttendanceBadge(isPresent) {
    if (!scanAttendance) return;
    if (isPresent) {
      scanAttendance.className = 'status-badge status-approved';
      scanAttendance.innerText = 'Present';
    } else {
      scanAttendance.className = 'status-badge status-pending';
      scanAttendance.innerText = 'Absent';
    }
  }

  // Reset helper on verification error
  function resetScannerProfile() {
    activeScannedToken = '';
    if (emptyView) emptyView.classList.remove('hidden');
    if (profileView) profileView.classList.remove('active');
    if (btnMarkPresent) btnMarkPresent.disabled = true;
  }
});
