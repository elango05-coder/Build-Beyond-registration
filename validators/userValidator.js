const { body } = require('express-validator');

// Rules for updating basic profile info (optional fields)
const profileUpdateRules = [
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('registerNumber')
    .optional()
    .isAlphanumeric()
    .withMessage('Register number must be alphanumeric')
    .isLength({ min: 3, max: 30 })
    .withMessage('Register number must be between 3 and 30 characters'),
  body('department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department cannot be empty'),
  body('year')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Year must be an integer between 1 and 5'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('github')
    .optional()
    .isURL()
    .withMessage('GitHub must be a valid URL')
    .contains('github.com')
    .withMessage('GitHub URL must link to github.com'),
  body('linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn must be a valid URL')
    .contains('linkedin.com')
    .withMessage('LinkedIn URL must link to linkedin.com'),
  body('portfolio')
    .optional()
    .isURL()
    .withMessage('Portfolio must be a valid URL'),
];

// Rules for submitting registration (all fields required)
const registrationRules = [
  body('phone')
    .isMobilePhone('any')
    .withMessage('A valid phone number is required'),
  body('registerNumber')
    .isAlphanumeric()
    .withMessage('Register number must be alphanumeric')
    .isLength({ min: 3, max: 30 })
    .withMessage('Register number must be between 3 and 30 characters'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  body('year')
    .isInt({ min: 1, max: 5 })
    .withMessage('Year must be an integer between 1 and 5'),
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('github')
    .isURL()
    .withMessage('A valid GitHub profile URL is required')
    .contains('github.com')
    .withMessage('GitHub URL must link to github.com'),
  body('linkedin')
    .isURL()
    .withMessage('A valid LinkedIn profile URL is required')
    .contains('linkedin.com')
    .withMessage('LinkedIn URL must link to linkedin.com'),
  body('portfolio')
    .isURL()
    .withMessage('A valid portfolio URL is required'),
  body('participationType')
    .isIn(['Individual', 'Team'])
    .withMessage('Participation type must be Individual or Team'),
];

module.exports = {
  profileUpdateRules,
  registrationRules,
};
