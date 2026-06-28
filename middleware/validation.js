const { validationResult } = require('express-validator');

/**
 * Middleware to execute express-validator checks and handle errors consistently
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`);
    res.status(400);
    const err = new Error('Validation failed');
    err.errors = errorMessages;
    return next(err);
  }
  next();
};

module.exports = validate;
