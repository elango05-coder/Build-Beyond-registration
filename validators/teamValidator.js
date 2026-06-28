const { body } = require('express-validator');

// Rules for creating a team
const createTeamRules = [
  body('teamName')
    .trim()
    .notEmpty()
    .withMessage('Team name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Team name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9 _-]+$/)
    .withMessage('Team name can only contain letters, numbers, spaces, underscores, and dashes'),
];

// Rules for joining a team
const joinTeamRules = [
  body('joinCode')
    .trim()
    .notEmpty()
    .withMessage('Team join code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Join code must be exactly 6 characters long'),
];

module.exports = {
  createTeamRules,
  joinTeamRules,
};
