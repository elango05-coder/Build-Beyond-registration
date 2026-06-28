const Team = require('../models/Team');
const User = require('../models/User');

/**
 * @desc    Create a new team and associate the leader
 * @route   POST /api/team/create
 * @access  Private
 */
const createTeam = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Prevent team creation if user is already in a team
    if (user.teamId) {
      res.status(400);
      return next(new Error('You are already associated with a team. Leave or delete the current team first.'));
    }

    // Check if user has already completed registration
    if (user.registrationStatus) {
      res.status(400);
      return next(new Error('Cannot create team after registration status has been set.'));
    }

    const { teamName } = req.body;

    // Check if team name is already taken
    const teamNameExists = await Team.findOne({ teamName });
    if (teamNameExists) {
      res.status(400);
      return next(new Error('Team name is already taken. Please choose another one.'));
    }

    // Generate a unique, collision-free 6-char alphanumeric join code
    let joinCode;
    let codeExists = true;
    while (codeExists) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const duplicateCode = await Team.findOne({ joinCode });
      if (!duplicateCode) {
        codeExists = false;
      }
    }

    // Create the team
    const newTeam = await Team.create({
      teamName,
      leader: user._id,
      members: [user._id],
      joinCode,
    });

    // Update user's team information
    user.teamId = newTeam._id;
    user.participationType = 'Team';
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Team created successfully. Share the join code with your teammate.',
      data: {
        team: newTeam,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join an existing team using its unique join code
 * @route   POST /api/team/join
 * @access  Private
 */
const joinTeam = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user is already in a team
    if (user.teamId) {
      res.status(400);
      return next(new Error('You are already associated with a team. Leave the current team first.'));
    }

    // Check if user registration has already been submitted
    if (user.registrationStatus) {
      res.status(400);
      return next(new Error('Cannot join a team after registration status has been set.'));
    }

    const { joinCode } = req.body;
    const team = await Team.findOne({ joinCode: joinCode.trim().toUpperCase() });

    if (!team) {
      res.status(404);
      return next(new Error('Invalid team join code. Please check the code and try again.'));
    }

    // Validate maximum team members count (max 2 members)
    if (team.members.length >= 2) {
      res.status(400);
      return next(new Error('This team is already full. A team can have a maximum of 2 members.'));
    }

    // Add user to the team members list
    team.members.push(user._id);
    await team.save();

    // Associate team in user schema
    user.teamId = team._id;
    user.participationType = 'Team';
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully joined team "${team.teamName}".`,
      data: {
        team,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details of the currently logged-in user's team
 * @route   GET /api/team/details
 * @access  Private
 */
const getTeamDetails = async (req, res, next) => {
  try {
    if (!req.user.teamId) {
      res.status(404);
      return next(new Error('You do not belong to any team.'));
    }

    const team = await Team.findById(req.user.teamId).populate({
      path: 'leader members',
      select: 'name email phone registerNumber department year gender registrationStatus',
    });

    if (!team) {
      res.status(404);
      return next(new Error('Your associated team record could not be found.'));
    }

    res.status(200).json({
      success: true,
      message: 'Team details retrieved successfully',
      data: {
        team,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  joinTeam,
  getTeamDetails,
};
