const QRCode = require('qrcode');

/**
 * Generate a QR Code Data URI for a given token
 * @param {string} token - The UUID QR token stored in MongoDB
 * @returns {Promise<string>} - Base64 Data URI of the QR Code image
 */
const generateQRCodeDataURI = async (token) => {
  try {
    if (!token) {
      throw new Error('Token is required to generate QR code');
    }
    
    // Generate the QR code as a PNG Data URI
    const dataUri = await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H', // High reliability for scanning on devices
      margin: 2,
      width: 300,
      color: {
        dark: '#000000', // Black modules
        light: '#FFFFFF', // White background
      },
    });

    return dataUri;
  } catch (error) {
    throw new Error(`QR Generation Failed: ${error.message}`);
  }
};

module.exports = {
  generateQRCodeDataURI,
};
