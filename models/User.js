const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    registerNumber: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: [1, 'Year must be at least 1'],
      max: [5, 'Year must be at most 5'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    googleId: {
      type: String,
      sparse: true, // Allow multiple nulls for local admins
    },
    role: {
      type: String,
      enum: ['User', 'Admin'],
      default: 'User',
    },
    github: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    portfolio: {
      type: String,
      trim: true,
    },
    participationType: {
      type: String,
      enum: ['Individual', 'Team'],
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    registrationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
    },
    attendanceQRToken: {
      type: String,
      unique: true,
      sparse: true, // Allow nulls for non-approved users
    },
    isPresent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
