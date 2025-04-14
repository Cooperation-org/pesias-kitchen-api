// src/services/qrCodeService.js
const QRCode = require('qrcode');
const crypto = require('crypto');

class QRCodeService {
  async generateActivityQR(activityId) {
    try {
      // Generate a unique token for verification
      const uniqueToken = crypto.randomBytes(16).toString('hex');
      
      // Create data to encode in QR
      const data = JSON.stringify({
        activityId,
        token: uniqueToken,
        timestamp: Date.now()
      });
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data);
      
      return {
        qrCodeDataUrl,
        token: uniqueToken
      };
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  validateQRData(scannedData, expectedToken) {
    try {
      const data = JSON.parse(scannedData);
      return data.token === expectedToken;
    } catch (error) {
      throw new Error(`Invalid QR code data: ${error.message}`);
    }
  }
}

module.exports = new QRCodeService();