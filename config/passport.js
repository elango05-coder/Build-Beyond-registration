const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('Google account does not have a valid email.'), null);
        }

        const domain = email.split('@')[1];
        const allowedDomain = process.env.COLLEGE_EMAIL_DOMAIN;

        // Perform domain check if restriction is configured
        if (allowedDomain && domain !== allowedDomain) {
          return done(
            new Error(`Access denied. Only @${allowedDomain} email accounts are allowed to register.`),
            null
          );
        }

        // Find or create user in DB
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Fallback check if user was created manually/previously with this email
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName || 'Google User',
              email: email,
              googleId: profile.id,
              role: 'User',
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// We are utilizing stateless JWTs, but Passport requires serialize/deserialize methods to be defined if session is initialized
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
