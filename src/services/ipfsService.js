// // src/services/ipfsService.js
// const { create } = require('ipfs-http-client');

// // Connect to Infura IPFS (you can use other providers too)
// const ipfs = create({
//   host: 'ipfs.infura.io',
//   port: 5001,
//   protocol: 'https',
//   headers: {
//     authorization: `Basic ${Buffer.from(
//       process.env.INFURA_IPFS_PROJECT_ID + ':' + process.env.INFURA_IPFS_PROJECT_SECRET
//     ).toString('base64')}`
//   }
// });

// exports.uploadToIPFS = async (content) => {
//   try {
//     // If content is a data URL, extract the base64 data
//     if (typeof content === 'string' && content.startsWith('data:')) {
//       const data = content.split(',')[1];
//       content = Buffer.from(data, 'base64');
//     }
    
//     const result = await ipfs.add(content);
//     return result.path; // This is the CID
//   } catch (error) {
//     console.error('IPFS upload error:', error);
//     throw new Error('Failed to upload to IPFS');
//   }
// };




// src/services/ipfsService.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.uploadToIPFS = async (content) => {
  try {
    // If content is a data URL, extract the base64 data
    if (typeof content === 'string' && content.startsWith('data:')) {
      const data = content.split(',')[1];
      content = Buffer.from(data, 'base64');
    }
    
    // Generate a unique filename
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const filename = `${hash}.json`;
    const filepath = path.join(uploadsDir, filename);
    
    // Save the file
    await fs.promises.writeFile(filepath, content);
    
    // Return a mock CID
    return `local-${hash}`;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to save file');
  }
};