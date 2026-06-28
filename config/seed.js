const Admin = require('../models/Admin');

/**
 * Seeds a default admin account into MongoDB if none exist
 */
const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@mycollege.edu';
      const password = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecurePassword123!';
      const name = 'System Administrator';

      await Admin.create({
        name,
        email,
        password,
        role: 'Admin',
      });
      console.log(`[SEED] Default admin account created: ${email}`);
    } else {
      console.log('[SEED] Admin accounts already exist, skipping seed.');
    }
  } catch (error) {
    console.error(`[SEED ERROR] Failed to seed default admin: ${error.message}`);
  }
};

module.exports = seedAdmin;
