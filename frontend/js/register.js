import { api } from './api.js';
import { checkUserAccess, logout } from './auth.js';
import { showToast, setBtnLoading } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce user access guard check
  checkUserAccess();

  // Elements
  const form = document.getElementById('registration-form');
  const logoutBtn = document.getElementById('logout-btn');
  
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const phoneInput = document.getElementById('reg-phone');
  const numberInput = document.getElementById('reg-number');
  const deptInput = document.getElementById('reg-dept');
  const yearSelect = document.getElementById('reg-year');
  const genderSelect = document.getElementById('reg-gender');
  
  const githubInput = document.getElementById('reg-github');
  const linkedinInput = document.getElementById('reg-linkedin');
  const portfolioInput = document.getElementById('reg-portfolio');
  
  const typeRadios = document.getElementsByName('participationType');
  const teamPanel = document.getElementById('team-form-section');
  
  const tabCreate = document.getElementById('tab-create');
  const tabJoin = document.getElementById('tab-join');
  const cardCreate = document.getElementById('card-create');
  const cardJoin = document.getElementById('card-join');
  
  const btnCreateTeam = document.getElementById('btn-create-team');
  const btnJoinTeam = document.getElementById('btn-join-team');
  const teamNameInput = document.getElementById('team-name-input');
  const teamCodeInput = document.getElementById('team-code-input');
  
  const teamStatusBox = document.getElementById('team-status-box');
  const displayTeamName = document.getElementById('display-team-name');
  const displayJoinCode = document.getElementById('display-join-code');
  const displayMembersList = document.getElementById('display-members-list');
  const btnSubmitReg = document.getElementById('btn-submit-registration');

  let activeUser = null;

  // Initialize: Load user profile details
  try {
    const payload = await api.get('/auth/me');
    activeUser = payload.data.user;

    // If registration is already submitted, redirect straight to dashboard
    if (activeUser.registrationStatus) {
      window.location.href = 'dashboard.html';
      return;
    }

    // Populate basic fields from Google Auth
    if (nameInput) nameInput.value = activeUser.name || '';
    if (emailInput) emailInput.value = activeUser.email || '';

    // Load teammate details if teamId exists in session
    if (activeUser.teamId) {
      await loadTeamDetails();
    }
  } catch (err) {
    showToast('Failed to fetch user session: ' + err.message, 'error');
  }

  // Logout trigger wire
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Toggle Participation Card selection UI
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      
      // Update active toggle-card UI state
      document.querySelectorAll('.toggle-card').forEach(card => {
        card.classList.remove('active');
      });
      radio.closest('.toggle-card').classList.add('active');

      // Toggle Team Details Box
      if (selectedValue === 'Team') {
        teamPanel.classList.add('active');
      } else {
        teamPanel.classList.remove('active');
      }
    });
  });

  // Team tab navigation
  if (tabCreate && tabJoin) {
    tabCreate.addEventListener('click', () => {
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
      cardCreate.classList.add('active');
      cardJoin.classList.remove('active');
    });

    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabCreate.classList.remove('active');
      cardJoin.classList.add('active');
      cardCreate.classList.remove('active');
    });
  }

  // API Call: Create Team
  if (btnCreateTeam) {
    btnCreateTeam.addEventListener('click', async () => {
      const teamName = teamNameInput.value.trim();
      if (!teamName) {
        showToast('Please enter a team name', 'warning');
        return;
      }

      setBtnLoading(btnCreateTeam, true, 'Create Team & Get Code');
      try {
        const res = await api.post('/team/create', { teamName });
        showToast(res.message, 'success');
        
        // Reload details
        await loadTeamDetails();
      } catch (err) {
        showToast(err.message || 'Team creation failed', 'error');
      } finally {
        setBtnLoading(btnCreateTeam, false, 'Create Team & Get Code');
      }
    });
  }

  // API Call: Join Team
  if (btnJoinTeam) {
    btnJoinTeam.addEventListener('click', async () => {
      const joinCode = teamCodeInput.value.trim();
      if (!joinCode || joinCode.length !== 6) {
        showToast('Please enter a valid 6-character join code', 'warning');
        return;
      }

      setBtnLoading(btnJoinTeam, true, 'Join Team');
      try {
        const res = await api.post('/team/join', { joinCode });
        showToast(res.message, 'success');
        
        // Reload details
        await loadTeamDetails();
      } catch (err) {
        showToast(err.message || 'Joining team failed', 'error');
      } finally {
        setBtnLoading(btnJoinTeam, false, 'Join Team');
      }
    });
  }

  // Helper: Get Team Details
  async function loadTeamDetails() {
    try {
      const res = await api.get('/team/details');
      const team = res.data.team;

      if (displayTeamName) displayTeamName.innerText = `Linked Team: ${team.teamName}`;
      if (displayJoinCode) displayJoinCode.innerText = team.joinCode;

      if (displayMembersList) {
        displayMembersList.innerHTML = '';
        team.members.forEach(member => {
          const isLeader = team.leader._id === member._id;
          const li = document.createElement('li');
          li.innerText = `${member.name} (${member.email})${isLeader ? ' - Leader' : ''}`;
          displayMembersList.appendChild(li);
        });
      }

      if (teamStatusBox) teamStatusBox.classList.add('active');
    } catch (err) {
      console.warn('Failed to load team details:', err);
    }
  }

  // Form Validation Runner
  function validateForm() {
    let isValid = true;

    // Reset error messages and invalid class
    document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('invalid'));

    // Validate phone number
    const phoneVal = phoneInput.value.trim();
    if (!phoneVal) {
      showError(phoneInput, 'err-phone', 'Phone number is required');
      isValid = false;
    } else if (!/^\+?[0-9]{10,14}$/.test(phoneVal)) {
      showError(phoneInput, 'err-phone', 'Enter a valid phone number (10-14 digits)');
      isValid = false;
    }

    // Validate register number
    const numVal = numberInput.value.trim();
    if (!numVal) {
      showError(numberInput, 'err-number', 'Register number is required');
      isValid = false;
    } else if (!/^[a-zA-Z0-9]{3,30}$/.test(numVal)) {
      showError(numberInput, 'err-number', 'Register number must be alphanumeric (3-30 chars)');
      isValid = false;
    }

    // Validate department
    if (!deptInput.value.trim()) {
      showError(deptInput, 'err-dept', 'Department is required');
      isValid = false;
    }

    // Validate year select
    if (!yearSelect.value) {
      showError(yearSelect, 'err-year', 'Please select a study year');
      isValid = false;
    }

    // Validate gender select
    if (!genderSelect.value) {
      showError(genderSelect, 'err-gender', 'Please select gender');
      isValid = false;
    }

    // Validate GitHub profile URL
    const gitVal = githubInput.value.trim();
    if (!gitVal) {
      showError(githubInput, 'err-github', 'GitHub profile link is required');
      isValid = false;
    } else if (!gitVal.startsWith('http') || !gitVal.includes('github.com')) {
      showError(githubInput, 'err-github', 'Please enter a valid GitHub URL (e.g. github.com/username)');
      isValid = false;
    }

    // Validate LinkedIn profile URL
    const linkVal = linkedinInput.value.trim();
    if (!linkVal) {
      showError(linkedinInput, 'err-linkedin', 'LinkedIn link is required');
      isValid = false;
    } else if (!linkVal.startsWith('http') || !linkVal.includes('linkedin.com')) {
      showError(linkedinInput, 'err-linkedin', 'Please enter a valid LinkedIn URL');
      isValid = false;
    }

    // Validate Portfolio URL
    const portVal = portfolioInput.value.trim();
    if (!portVal) {
      showError(portfolioInput, 'err-portfolio', 'Portfolio website link is required');
      isValid = false;
    } else if (!portVal.startsWith('http')) {
      showError(portfolioInput, 'err-portfolio', 'Please enter a valid portfolio URL link');
      isValid = false;
    }

    return isValid;
  }

  // Error layout display helper
  function showError(input, errorId, message) {
    input.classList.add('invalid');
    const errEl = document.getElementById(errorId);
    if (errEl) {
      errEl.innerText = message;
      errEl.style.display = 'block';
    }
  }

  // Form Submit Submission Logic
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        showToast('Please correct validation errors first.', 'warning');
        return;
      }

      const pType = document.querySelector('input[name="participationType"]:checked').value;

      // Double-check team association if Team type selected
      if (pType === 'Team') {
        const teamAssoc = document.getElementById('team-status-box').classList.contains('active');
        if (!teamAssoc) {
          showToast('You must create or join a team first before registering as Team.', 'warning');
          return;
        }
      }

      const submissionPayload = {
        phone: phoneInput.value.trim(),
        registerNumber: numberInput.value.trim(),
        department: deptInput.value.trim(),
        year: parseInt(yearSelect.value),
        gender: genderSelect.value,
        github: githubInput.value.trim(),
        linkedin: linkedinInput.value.trim(),
        portfolio: portfolioInput.value.trim(),
        participationType: pType
      };

      setBtnLoading(btnSubmitReg, true, 'Submit Registration');
      try {
        const res = await api.post('/users/register', submissionPayload);
        
        // Update stored profile structure
        localStorage.setItem('user', JSON.stringify(res.data.user));

        showToast(res.message, 'success');

        // Redirect user to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);

      } catch (err) {
        showToast(err.message || 'Submission failed.', 'error');
      } finally {
        setBtnLoading(btnSubmitReg, false, 'Submit Registration');
      }
    });
  }
});
