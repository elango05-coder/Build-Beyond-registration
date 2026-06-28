const express = require('express');
const {
  scanQRCode,
  markAttendance,
  getAttendanceList,
  getAttendanceStats,
} = require('../controllers/attendanceController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Apply JWT auth protection and Admin restrictions to all attendance endpoints
router.use(protect);
router.use(restrictTo('Admin'));

router.post('/scan', scanQRCode);
router.post('/mark', markAttendance);
router.get('/list', getAttendanceList);
router.get('/stats', getAttendanceStats);

module.exports = router;
