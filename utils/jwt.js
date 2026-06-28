const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for the user/admin
 * @param {string} id - The database ID of the user/admin
 * @param {string} role - The role of the user/admin (User/Admin)
 * @param {string} type - The token subject type ('user' or 'admin')
 * @returns {string} - Signed JWT
 */
const signToken = (id, role, type = 'user') => {
  return jwt.sign(
    { id, role, type },
    process.env.JWT_SECRET || 'supersecretjwtkey123!@#',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = signToken;
