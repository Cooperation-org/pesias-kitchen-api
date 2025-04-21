const ethers = require('ethers');

exports.verifySignature = async (address, message, signature) => {
  try {
    // Format the message that was signed
    const formattedMessage = `Sign this message to authenticate with Pesia's Kitchen EAT Initiative: ${message}`;
    
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(formattedMessage, signature);
    
    // Compare the recovered address with the provided address
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};