import { api } from './api.js';
import { checkUserAccess, logout } from './auth.js';
import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce user access guard
  checkUserAccess();

  // Elements
  const logoutBtn = document.getElementById('logout-btn');
  const userDisplayName = document.getElementById('user-display-name');
  
  const badgeRegStatus = document.getElementById('badge-reg-status');
  const statusInstructions = document.getElementById('status-instructions');
  const qrAccessSection = document.getElementById('qr-access-section');
  const progressFill = document.getElementById('progress-fill');
  
  const nodeRegistered = document.getElementById('node-registered');
  const nodeApproved = document.getElementById('node-approved');
  const nodePresent = document.getElementById('node-present');

  // Sidebar Profile Elements
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileReg = document.getElementById('profile-reg-number');
  const profileDept = document.getElementById('profile-dept');
  const profileYear = document.getElementById('profile-year');
  const profilePhone = document.getElementById('profile-phone');
  const profileGender = document.getElementById('profile-gender');
  
  const linkGithub = document.getElementById('link-github');
  const linkLinkedin = document.getElementById('link-linkedin');
  const linkPortfolio = document.getElementById('link-portfolio');

  // Team Elements
  const cardTeamInfo = document.getElementById('card-team-info');
  const displayTeamName = document.getElementById('team-name');
  const displayTeamCode = document.getElementById('team-code');
  const teamMembersRows = document.getElementById('team-members-rows');

  // Load dashboard data on mount
  try {
    const res = await api.get('/users/profile');
    const user = res.data.user;

    // Check if user has actually submitted registration. If not, redirect to register
    if (!user.registrationStatus) {
      showToast('Please complete registration profile first.', 'info');
      setTimeout(() => {
        window.location.href = 'register.html';
      }, 1000);
      return;
    }

    // Populate profile top
    if (userDisplayName) userDisplayName.innerText = user.name.split(' ')[0];
    if (profileName) profileName.innerText = user.name;
    if (profileEmail) profileEmail.innerText = user.email;
    if (profileReg) profileReg.innerText = user.registerNumber || '-';
    if (profileDept) profileDept.innerText = user.department || '-';
    if (profileYear) profileYear.innerText = user.year ? `${user.year} Year` : '-';
    if (profilePhone) profilePhone.innerText = user.phone || '-';
    if (profileGender) profileGender.innerText = user.gender || '-';

    // Populate social profile links
    if (linkGithub) linkGithub.href = user.github || '#';
    if (linkLinkedin) linkLinkedin.href = user.linkedin || '#';
    if (linkPortfolio) linkPortfolio.href = user.portfolio || '#';

    // Render Milestone progress tracker & Badge States
    updateMilestones(user);

    // Render Team specifications if selected
    if (user.participationType === 'Team' && user.teamId) {
      renderTeamDetails(user.teamId, user._id);
    } else {
      // Hide or show empty Individual state
      if (cardTeamInfo) {
        cardTeamInfo.innerHTML = `
          <h3>👥 Team details</h3>
          <p class="status-note-text" style="margin-bottom:0;">You are registered as an <strong>Individual Participant</strong>. No team is linked to this account.</p>
        `;
      }
    }

  } catch (err) {
    showToast('Failed to load profile details: ' + err.message, 'error');
  }

  // Logout hook
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Milestones State updates helper
  function updateMilestones(user) {
    const status = user.registrationStatus;
    const present = user.isPresent;

    // Update Status Badge UI
    badgeRegStatus.className = `status-badge status-${status.toLowerCase()}`;
    badgeRegStatus.innerText = status;

    let fillWidth = 33; // Default registered width
    nodeRegistered.classList.add('active', 'complete');

    if (status === 'Approved') {
      statusInstructions.innerHTML = `🎉 Congratulations! Your profile has been reviewed and approved by the organizers. Click the button below to retrieve your event entry pass and QR Code.`;
      qrAccessSection.classList.add('active');
      nodeApproved.classList.add('active', 'complete');
      fillWidth = 66;

      if (present) {
        nodePresent.classList.add('active', 'complete');
        fillWidth = 100;
        statusInstructions.innerHTML = `🏁 Welcome to Buildathon '26! Your attendance has been checked in successfully at the venue entrance. Happy Hacking!`;
      }
    } else if (status === 'Rejected') {
      statusInstructions.innerHTML = `❌ Your registration profile was evaluated and rejected by the administrators. Please check your profile inputs or contact the coordinator help desk.`;
      nodeApproved.innerHTML = `<span class="node-icon">❌</span><span class="node-label">Rejected</span>`;
      nodeApproved.classList.add('active');
      fillWidth = 66;
    } else {
      // Pending
      statusInstructions.innerHTML = `Your application is currently pending admin review. We are evaluating your social profiles, register number, and project portfolio. Check back shortly.`;
    }

    if (progressFill) {
      progressFill.style.width = `${fillWidth}%`;
    }
  }

  // Team Details renderer helper
  function renderTeamDetails(team, currentUserId) {
    displayTeamName.innerText = team.teamName;
    displayTeamCode.innerText = team.joinCode;

    teamMembersRows.innerHTML = '';
    team.members.forEach(member => {
      const isLeader = team.leader._id === member._id;
      const isSelf = member._id === currentUserId;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${member.name}</strong> ${isSelf ? '(You)' : ''}</td>
        <td>${member.email}</td>
        <td>${member.department || '-'} | Yr ${member.year || '-'}</td>
        <td>
          <span class="meta-badge" style="font-size:0.75rem; padding: 2px 8px; border-radius:10px; background: ${isLeader ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)'}; color: ${isLeader ? 'var(--color-purple)' : 'var(--text-muted)'};">
            ${isLeader ? 'Leader' : 'Member'}
          </span>
        </td>
      `;
      teamMembersRows.appendChild(tr);
    });
  }
});
