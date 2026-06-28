const { v4: uuidv4 } = require('uuid');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Team = require('../models/Team');
const signToken = require('../utils/jwt');

/**
 * @desc    Local login for administrator accounts
 * @route   POST /api/admin/login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const token = signToken(admin._id, admin.role, 'admin');

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics, summaries, and latest applications
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    // 1. Get counts
    const totalRegistrations = await User.countDocuments({
      registrationStatus: { $exists: true },
    });
    const pendingCount = await User.countDocuments({ registrationStatus: 'Pending' });
    const approvedCount = await User.countDocuments({ registrationStatus: 'Approved' });
    const rejectedCount = await User.countDocuments({ registrationStatus: 'Rejected' });
    const presentCount = await User.countDocuments({ isPresent: true });
    
    // Absent means they are approved but not marked present yet
    const absentCount = await User.countDocuments({
      registrationStatus: 'Approved',
      isPresent: false,
    });

    // 2. Latest registrations
    const latestRegistrations = await User.find({ registrationStatus: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('teamId', 'teamName');

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: {
        stats: {
          totalRegistrations,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          present: presentCount,
          absent: absentCount,
        },
        latestRegistrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending registrations
 * @route   GET /api/admin/pending
 * @access  Private (Admin only)
 */
const getPendingRegistrations = async (req, res, next) => {
  try {
    const list = await User.find({ registrationStatus: 'Pending' })
      .sort({ updatedAt: -1 })
      .populate('teamId');

    res.status(200).json({
      success: true,
      message: 'Pending registrations retrieved successfully',
      data: {
        registrations: list,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all approved registrations
 * @route   GET /api/admin/approved
 * @access  Private (Admin only)
 */
const getApprovedRegistrations = async (req, res, next) => {
  try {
    const list = await User.find({ registrationStatus: 'Approved' })
      .sort({ updatedAt: -1 })
      .populate('teamId');

    res.status(200).json({
      success: true,
      message: 'Approved registrations retrieved successfully',
      data: {
        registrations: list,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all rejected registrations
 * @route   GET /api/admin/rejected
 * @access  Private (Admin only)
 */
const getRejectedRegistrations = async (req, res, next) => {
  try {
    const list = await User.find({ registrationStatus: 'Rejected' })
      .sort({ updatedAt: -1 })
      .populate('teamId');

    res.status(200).json({
      success: true,
      message: 'Rejected registrations retrieved successfully',
      data: {
        registrations: list,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve registration and generate unique entry pass UUID token
 * @route   POST /api/admin/approve/:id
 * @access  Private (Admin only)
 */
const approveRegistration = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.registrationStatus !== 'Pending') {
      res.status(400);
      return next(
        new Error(`Cannot approve user. Current registration status is ${user.registrationStatus || 'Not Submitted'}`)
      );
    }

    // Generate UUID token
    const uniqueToken = uuidv4();

    user.registrationStatus = 'Approved';
    user.attendanceQRToken = uniqueToken;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully. QR entry token generated.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          registrationStatus: user.registrationStatus,
          attendanceQRToken: user.attendanceQRToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject registration
 * @route   POST /api/admin/reject/:id
 * @access  Private (Admin only)
 */
const rejectRegistration = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.registrationStatus !== 'Pending') {
      res.status(400);
      return next(
        new Error(`Cannot reject user. Current registration status is ${user.registrationStatus || 'Not Submitted'}`)
      );
    }

    user.registrationStatus = 'Rejected';
    // Clear any previous QR token
    user.attendanceQRToken = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Registration rejected successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          registrationStatus: user.registrationStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search for users based on name, email, registerNumber, or department
 * @route   GET /api/admin/search/users
 * @access  Private (Admin only)
 */
const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.query;
    if (!query) {
      res.status(400);
      return next(new Error('Search query is required'));
    }

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { registerNumber: regex },
        { department: regex },
      ],
    }).populate('teamId');

    res.status(200).json({
      success: true,
      message: `Found ${users.length} users matching search criteria`,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search for teams based on teamName
 * @route   GET /api/admin/search/teams
 * @access  Private (Admin only)
 */
const searchTeams = async (req, res, next) => {
  try {
    const query = req.query.query;
    if (!query) {
      res.status(400);
      return next(new Error('Search query is required'));
    }

    const regex = new RegExp(query, 'i');
    const teams = await Team.find({ teamName: regex }).populate(
      'leader members',
      'name email phone registerNumber department year'
    );

    res.status(200).json({
      success: true,
      message: `Found ${teams.length} teams matching search criteria`,
      data: {
        teams,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  getAdminDashboard,
  getPendingRegistrations,
  getApprovedRegistrations,
  getRejectedRegistrations,
  approveRegistration,
  rejectRegistration,
  searchUsers,
  searchTeams,
};
