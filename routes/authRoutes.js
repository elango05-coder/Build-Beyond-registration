const express = require('express');
const {
  googleLoginToken,
  googleRedirect,
  googleCallback,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Google Sign-In / ID Token Login
router.post('/google', googleLoginToken);

// Google OAuth redirect-based strategy triggers
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

// Profile & Session Management
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
