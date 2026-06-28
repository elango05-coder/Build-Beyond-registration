import { api } from './api.js';
import { checkUserAccess } from './auth.js';
import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce user access guard
  checkUserAccess();

  // Elements
  const passQrImage = document.getElementById('pass-qr-image');
  const passUserName = document.getElementById('pass-user-name');
  const passUserReg = document.getElementById('pass-user-reg');
  const passUserDept = document.getElementById('pass-user-dept');
  const passUserYear = document.getElementById('pass-user-year');
  const passUserType = document.getElementById('pass-user-type');
  const passTeamRow = document.getElementById('pass-team-row');
  const passTeamName = document.getElementById('pass-team-name');
  const passTokenId = document.getElementById('pass-token-id');

  const btnPrint = document.getElementById('btn-print');
  const btnDownload = document.getElementById('btn-download');

  let qrBase64Data = '';

  // Load pass details on mount
  try {
    const res = await api.get('/users/pass');
    const data = res.data;

    qrBase64Data = data.qrCode;

    // Populate Pass Card DOM elements
    if (passQrImage) passQrImage.src = qrBase64Data;
    if (passUserName) passUserName.innerText = data.user.name;
    if (passUserReg) passUserReg.innerText = data.user.registerNumber || '-';
    if (passUserDept) passUserDept.innerText = data.user.department || '-';
    if (passUserYear) passUserYear.innerText = data.user.year ? `${data.user.year} Year` : '-';
    
    // Load participation details
    try {
      const profileRes = await api.get('/users/profile');
      const profile = profileRes.data.user;

      if (passUserType) passUserType.innerText = profile.participationType || 'Individual';
      
      if (profile.participationType === 'Team' && profile.teamId) {
        if (passTeamName) passTeamName.innerText = profile.teamId.teamName;
        if (passTeamRow) passTeamRow.style.display = 'flex';
      } else {
        if (passTeamRow) passTeamRow.style.display = 'none';
      }
    } catch (profileErr) {
      console.warn('Failed to load full user details for pass:', profileErr);
    }

    if (passTokenId) passTokenId.innerText = data.attendanceQRToken.substring(0, 18) + '...';

  } catch (err) {
    showToast(err.message || 'Failed to retrieve entry pass', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  }

  // Action: Print Badge
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Action: Download Badge Image
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!qrBase64Data) {
        showToast('QR Code data is not available yet', 'warning');
        return;
      }
      
      // Create helper download link
      const link = document.createElement('a');
      link.href = qrBase64Data;
      link.download = 'Buildathon_Entry_Pass.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Downloading Entry Pass...', 'success');
    });
  }
});
