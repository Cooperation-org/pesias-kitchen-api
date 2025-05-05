const ethers = require('ethers');

exports.verifySignature = async (address, message, signature) => {
  try {
    const formattedMessage = `Sign this message to authenticate with Pesia's Kitchen EAT Initiative: ${message}`;
    const recoveredAddress = ethers.utils.verifyMessage(formattedMessage, signature);

    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};