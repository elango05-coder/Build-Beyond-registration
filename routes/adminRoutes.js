const express = require('express');
const {
  adminLogin,
  getAdminDashboard,
  getPendingRegistrations,
  getApprovedRegistrations,
  getRejectedRegistrations,
  approveRegistration,
  rejectRegistration,
  searchUsers,
  searchTeams,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { adminLoginRules } = require('../validators/adminValidator');

const router = express.Router();

// Public Admin Login
router.post('/login', adminLoginRules, validate, adminLogin);

// Protected Admin Routes (require login and Admin role)
router.use(protect);
router.use(restrictTo('Admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/pending', getPendingRegistrations);
router.get('/approved', getApprovedRegistrations);
router.get('/rejected', getRejectedRegistrations);

router.post('/approve/:id', approveRegistration);
router.post('/reject/:id', rejectRegistration);

router.get('/search/users', searchUsers);
router.get('/search/teams', searchTeams);

module.exports = router;
