const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team leader is required'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    joinCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to ensure a maximum of 2 members
teamSchema.pre('validate', function () {
  if (this.members && this.members.length > 2) {
    throw new Error('Teams cannot have more than 2 members');
  }
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
