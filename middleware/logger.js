const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Ensure log directory exists
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

// Setup dev logger format for console and combined format for file
const consoleLogger = morgan('dev');
const fileLogger = morgan('combined', { stream: accessLogStream });

module.exports = {
  consoleLogger,
  fileLogger,
};
