require('dotenv').config();
const { ethers } = require('ethers');

async function checkBalance() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
    
    const tokenContract = new ethers.Contract(
      g$TokenAddress,
      ['function balanceOf(address account) external view returns (uint256)',
       'function symbol() external view returns (string)'],
      provider
    );
    
    const symbol = await tokenContract.symbol();
    
    const balance = await tokenContract.balanceOf(wallet.address);
    
    return {
      address: wallet.address,
      balance: ethers.utils.formatEther(balance),
      symbol
    };
  } catch (error) {
    throw error;
  }
}

checkBalance()
  .then(result => {
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  });