const { body } = require('express-validator');

// Rules for admin credential login
const adminLoginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Admin email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

module.exports = {
  adminLoginRules,
};
