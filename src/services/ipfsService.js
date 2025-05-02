const axios = require('axios');
const FormData = require('form-data');

exports.uploadToIPFS = async (content) => {
  try {
    let fileContent = content;
    if (typeof content === 'string' && content.startsWith('data:')) {
      const matches = content.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const data = matches[2];
        fileContent = Buffer.from(data, 'base64');
      }
    }
    
    const formData = new FormData();
    formData.append('file', fileContent, {
      filename: `qrcode-${Date.now()}.png`,
      contentType: 'image/png',
    });
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxContentLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_API_SECRET,
        },
      }
    );
    
    if (response.status === 200) {
      return response.data.IpfsHash;
    } else {
      throw new Error(`Pinata responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
};