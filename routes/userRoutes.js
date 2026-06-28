const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  registerUser,
  getUserStatus,
  getUserPass,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  profileUpdateRules,
  registrationRules,
} = require('../validators/userValidator');

const router = express.Router();

// Apply protect middleware to all routes in this router
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', profileUpdateRules, validate, updateUserProfile);
router.post('/register', registrationRules, validate, registerUser);
router.get('/status', getUserStatus);
router.get('/pass', getUserPass);

module.exports = router;
