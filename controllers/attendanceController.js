const User = require('../models/User');

/**
 * @desc    Verify QR token and return user details (before marking present)
 * @route   POST /api/attendance/scan
 * @access  Private (Admin only)
 */
const scanQRCode = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      return next(new Error('QR Token is required for scan verification.'));
    }

    const user = await User.findOne({ attendanceQRToken: token }).populate('teamId', 'teamName');
    if (!user) {
      res.status(404);
      return next(new Error('Invalid QR Code. Participant not found.'));
    }

    if (user.registrationStatus !== 'Approved') {
      res.status(400);
      return next(
        new Error(`Scan rejected: Participant registration status is "${user.registrationStatus}".`)
      );
    }

    res.status(200).json({
      success: true,
      message: 'QR Code verified successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          registerNumber: user.registerNumber,
          department: user.department,
          year: user.year,
          gender: user.gender,
          participationType: user.participationType,
          team: user.teamId,
          isPresent: user.isPresent,
          registrationStatus: user.registrationStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark attendance for a participant (Strictly once)
 * @route   POST /api/attendance/mark
 * @access  Private (Admin only)
 */
const markAttendance = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      return next(new Error('QR Token is required to mark attendance.'));
    }

    const user = await User.findOne({ attendanceQRToken: token });
    if (!user) {
      res.status(404);
      return next(new Error('Invalid QR Code. Participant not found.'));
    }

    if (user.registrationStatus !== 'Approved') {
      res.status(400);
      return next(new Error('Cannot mark attendance for unapproved registrations.'));
    }

    // Prevent duplicate attendance marking
    if (user.isPresent) {
      return res.status(200).json({
        success: false,
        message: 'Already Present',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            registerNumber: user.registerNumber,
            isPresent: user.isPresent,
          },
        },
      });
    }

    user.isPresent = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          registerNumber: user.registerNumber,
          isPresent: user.isPresent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of participants filtered by attendance
 * @route   GET /api/attendance/list
 * @access  Private (Admin only)
 */
const getAttendanceList = async (req, res, next) => {
  try {
    const { present } = req.query;
    const filter = { registrationStatus: 'Approved' };

    if (present !== undefined) {
      filter.isPresent = present === 'true';
    }

    const list = await User.find(filter)
      .sort({ name: 1 })
      .populate('teamId', 'teamName');

    res.status(200).json({
      success: true,
      message: 'Attendance list retrieved successfully',
      data: {
        count: list.length,
        participants: list,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance metrics and percentage
 * @route   GET /api/attendance/stats
 * @access  Private (Admin only)
 */
const getAttendanceStats = async (req, res, next) => {
  try {
    const approvedCount = await User.countDocuments({ registrationStatus: 'Approved' });
    const presentCount = await User.countDocuments({ registrationStatus: 'Approved', isPresent: true });
    const absentCount = approvedCount - presentCount;

    const checkInRate = approvedCount > 0 ? ((presentCount / approvedCount) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      message: 'Attendance stats retrieved successfully',
      data: {
        totalApproved: approvedCount,
        present: presentCount,
        absent: absentCount,
        checkInRatePercentage: parseFloat(checkInRate),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanQRCode,
  markAttendance,
  getAttendanceList,
  getAttendanceStats,
};
