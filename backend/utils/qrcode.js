// qr code utility functions
// handles qr code generation for tickets

const QRCode = require('qrcode');

// generate qr code as data url
const generateQRCode = async (data) => {
  try {
    // convert data object to json string if needed
    const qrData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // generate qr code as data url
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('error generating qr code:', error);
    throw error;
  }
};

// generate qr code as buffer
const generateQRCodeBuffer = async (data) => {
  try {
    // convert data object to json string if needed
    const qrData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // generate qr code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    
    return qrCodeBuffer;
  } catch (error) {
    console.error('error generating qr code buffer:', error);
    throw error;
  }
};

// parse qr code data
const parseQRData = (qrString) => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    // if not json, return as is
    return qrString;
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  parseQRData
};
