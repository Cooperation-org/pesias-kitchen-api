// scripts/check-g-dollar-balance.js
require('dotenv').config();
const { ethers } = require('ethers');

async function checkBalance() {
  try {
    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log(`Checking G$ balance for wallet: ${wallet.address}`);
    
    // G$ token on Celo
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
    
    // Create token contract instance
    const tokenContract = new ethers.Contract(
      g$TokenAddress,
      ['function balanceOf(address account) external view returns (uint256)',
       'function symbol() external view returns (string)'],
      provider
    );
    
    // Get token symbol
    const symbol = await tokenContract.symbol();
    
    // Get balance
    const balance = await tokenContract.balanceOf(wallet.address);
    
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ${symbol}`);
    
    return {
      address: wallet.address,
      balance: ethers.utils.formatEther(balance),
      symbol
    };
  } catch (error) {
    console.error('Error checking balance:', error);
    throw error;
  }
}

// Run the function
checkBalance()
  .then(result => {
    console.log('Balance check completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Balance check failed:', error);
    process.exit(1);
  });