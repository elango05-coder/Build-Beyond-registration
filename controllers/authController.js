const { OAuth2Client } = require('google-auth-library');
const passport = require('passport');
const User = require('../models/User');
const signToken = require('../utils/jwt');

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id');

/**
 * @desc    Google OAuth login using ID token exchange from frontend
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLoginToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      return next(new Error('Google ID token (token) is required in request body.'));
    }

    let payload;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Handle mock token for postman / integration testing offline
    if (!clientId || clientId === 'dummy_client_id' || token.startsWith('mock_')) {
      const mockId = token.replace('mock_', '');
      payload = {
        sub: `mock_google_id_${mockId}`,
        email: `${mockId}@${process.env.COLLEGE_EMAIL_DOMAIN || 'mycollege.edu'}`,
        name: `Mock Student ${mockId}`,
      };
    } else {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      payload = ticket.getPayload();
    }

    const { sub: googleId, email, name } = payload;

    // Verify college domain
    const emailDomain = email.split('@')[1];
    const allowedDomain = process.env.COLLEGE_EMAIL_DOMAIN;

    if (allowedDomain && emailDomain !== allowedDomain) {
      res.status(403);
      return next(
        new Error(`Access denied. Only @${allowedDomain} email accounts are allowed.`)
      );
    }

    // Find or create the user in the database
    let user = await User.findOne({ googleId });
    if (!user) {
      // Look up by email if created via admin / manually
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          role: 'User',
        });
      }
    }

    // Generate JWT
    const jwtToken = signToken(user._id, user.role, 'user');

    // Set cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Initiate Google OAuth redirect flow
 * @route   GET /api/auth/google/redirect
 * @access  Public
 */
const googleRedirect = (req, res, next) => {
  const redirectUri = req.query.redirect_uri || req.headers.referer;
  let frontendRedirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (redirectUri) {
    try {
      const parsedUrl = new URL(redirectUri);
      if (parsedUrl.protocol !== 'file:') {
        // Keep the exact origin + pathname + search (without token/error params)
        const params = new URLSearchParams(parsedUrl.search);
        params.delete('token');
        params.delete('error');
        const searchStr = params.toString();
        frontendRedirectUrl = `${parsedUrl.origin}${parsedUrl.pathname}${searchStr ? '?' + searchStr : ''}`;
      }
    } catch (e) {
      console.error('Failed to parse redirect uri:', e);
    }
  }

  // Normalize fallback URL to have a login page path if it is just a domain origin
  if (frontendRedirectUrl === 'http://localhost:3000' || frontendRedirectUrl === 'http://localhost:3000/') {
    frontendRedirectUrl = 'http://localhost:3000/login.html';
  } else if (process.env.FRONTEND_URL && frontendRedirectUrl === process.env.FRONTEND_URL) {
    if (frontendRedirectUrl.endsWith('/')) {
      frontendRedirectUrl += 'login.html';
    } else {
      frontendRedirectUrl += '/login.html';
    }
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: frontendRedirectUrl,
  })(req, res, next);
};

/**
 * @desc    Google OAuth Callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    let frontendUrl = req.query.state || process.env.FRONTEND_URL || 'http://localhost:3000/login.html';

    // Normalize fallback URL to have a login page path if it is just a domain origin
    if (frontendUrl === 'http://localhost:3000' || frontendUrl === 'http://localhost:3000/') {
      frontendUrl = 'http://localhost:3000/login.html';
    } else if (process.env.FRONTEND_URL && frontendUrl === process.env.FRONTEND_URL) {
      if (frontendUrl.endsWith('/')) {
        frontendUrl += 'login.html';
      } else {
        frontendUrl += '/login.html';
      }
    }

    const separator = frontendUrl.includes('?') ? '&' : '?';

    if (err || !user) {
      const errorMsg = err ? err.message : 'Google OAuth authentication failed';
      return res.redirect(`${frontendUrl}${separator}error=${encodeURIComponent(errorMsg)}`);
    }

    const jwtToken = signToken(user._id, user.role, 'user');

    // Set cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend dashboard with token as a query parameter
    res.redirect(`${frontendUrl}${separator}token=${jwtToken}`);
  })(req, res, next);
};

/**
 * @desc    Get details of currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User authentication details retrieved successfully',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out & clear token cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000), // expire in 10 seconds
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleLoginToken,
  googleRedirect,
  googleCallback,
  getMe,
  logout,
};
