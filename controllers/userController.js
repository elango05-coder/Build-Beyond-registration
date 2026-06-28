const User = require('../models/User');
const Team = require('../models/Team');
const { generateQRCodeDataURI } = require('../services/qrService');

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    // Populate team details if user belongs to a team
    const user = await User.findById(req.user._id).populate({
      path: 'teamId',
      populate: {
        path: 'leader members',
        select: 'name email phone registerNumber department year gender',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details (can be called before full registration)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = [
      'phone',
      'registerNumber',
      'department',
      'year',
      'gender',
      'github',
      'linkedin',
      'portfolio',
    ];

    const updateData = {};
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if registration is already approved or pending to prevent changes that alter evaluation
    if (req.user.registrationStatus === 'Approved') {
      res.status(400);
      return next(new Error('Profile cannot be modified after registration is approved.'));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit event registration details and trigger Pending status
 * @route   POST /api/users/register
 * @access  Private
 */
const registerUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Prevent duplicate registration submissions
    if (user.registrationStatus) {
      res.status(400);
      return next(
        new Error(`Registration already submitted. Current status: ${user.registrationStatus}`)
      );
    }

    // Capture registration fields from body
    const {
      phone,
      registerNumber,
      department,
      year,
      gender,
      github,
      linkedin,
      portfolio,
      participationType,
    } = req.body;

    // Additional validations
    if (participationType === 'Team') {
      if (!user.teamId) {
        res.status(400);
        return next(
          new Error('You must create or join a team before registering as a Team participant.')
        );
      }
      
      // Double check that the team exists and has this user
      const team = await Team.findById(user.teamId);
      if (!team || (!team.leader.equals(user._id) && !team.members.includes(user._id))) {
        res.status(400);
        return next(new Error('The linked team does not exist or you are not a member of it.'));
      }
    }

    // Update user profile details and transition status to Pending
    user.phone = phone;
    user.registerNumber = registerNumber;
    user.department = department;
    user.year = year;
    user.gender = gender;
    user.github = github;
    user.linkedin = linkedin;
    user.portfolio = portfolio;
    user.participationType = participationType;
    user.registrationStatus = 'Pending';

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Buildathon registration submitted successfully. Your profile is pending review.',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check registration and attendance status
 * @route   GET /api/users/status
 * @access  Private
 */
const getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Status retrieved successfully',
      data: {
        registrationStatus: user.registrationStatus || 'Not Registered',
        isPresent: user.isPresent,
        participationType: user.participationType || 'Unspecified',
        teamId: user.teamId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get entry pass QR Code
 * @route   GET /api/users/pass
 * @access  Private
 */
const getUserPass = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.registrationStatus !== 'Approved') {
      res.status(400);
      return next(
        new Error(
          `Your entry pass is not available. Registration status: ${
            user.registrationStatus || 'Not Registered'
          }`
        )
      );
    }

    if (!user.attendanceQRToken) {
      res.status(404);
      return next(
        new Error('Entry pass token was not generated. Please contact an administrator.')
      );
    }

    // Generate Base64 QR Data URL using the saved attendance UUID token
    const qrCodeDataUrl = await generateQRCodeDataURI(user.attendanceQRToken);

    res.status(200).json({
      success: true,
      message: 'Entry pass QR Code retrieved successfully',
      data: {
        qrCode: qrCodeDataUrl,
        attendanceQRToken: user.attendanceQRToken,
        user: {
          name: user.name,
          email: user.email,
          registerNumber: user.registerNumber,
          department: user.department,
          year: user.year,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  registerUser,
  getUserStatus,
  getUserPass,
};
