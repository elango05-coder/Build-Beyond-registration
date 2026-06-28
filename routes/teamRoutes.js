const express = require('express');
const {
  createTeam,
  joinTeam,
  getTeamDetails,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  createTeamRules,
  joinTeamRules,
} = require('../validators/teamValidator');

const router = express.Router();

// Apply JWT auth protection to all routes in this router
router.use(protect);

router.post('/create', createTeamRules, validate, createTeam);
router.post('/join', joinTeamRules, validate, joinTeam);
router.get('/details', getTeamDetails);

module.exports = router;
