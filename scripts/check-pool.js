// scripts/check-pool.js
require('dotenv').config();
const { ethers } = require('ethers');

async function checkPool() {
  try {
    // Import the SDK
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    // Initialize provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    // Initialize SDK with chainId as string
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider);
    
    // Get pool address from env
    const poolAddress = process.env.POOL_ADDRESS;
    
    if (!poolAddress) {
      throw new Error('Pool address not found in environment');
    }
    
    console.log(`Checking pool at address: ${poolAddress}`);
    
    // Get the pool
    const pool = await sdk.getPool(poolAddress);
    
    // Get pool settings
    const settings = await pool.settings();
    console.log('Pool settings:', {
      nftType: settings.nftType.toString(),
      manager: settings.manager,
      rewardToken: settings.rewardToken,
      validEvents: settings.validEvents.map(v => v.toString()),
      rewardPerEvent: settings.rewardPerEvent.map(r => ethers.utils.formatEther(r)),
    });
    
    // Get pool attributes
    console.log('Checking pool attributes...');
    try {
      const attributes = await pool.attributes();
      console.log('Pool attributes:', attributes);
    } catch (error) {
      console.warn('Could not get pool attributes:', error.message);
    }
    
    // Fetch G$ token balance of the pool
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
    const tokenContract = new ethers.Contract(
      g$TokenAddress,
      ['function balanceOf(address account) external view returns (uint256)'],
      provider
    );
    
    const balance = await tokenContract.balanceOf(poolAddress);
    console.log('Pool G$ balance:', ethers.utils.formatEther(balance));
    
    return {
      address: poolAddress,
      balance: ethers.utils.formatEther(balance),
      settings: {
        nftType: settings.nftType.toString(),
        manager: settings.manager,
        rewardToken: settings.rewardToken,
        validEvents: settings.validEvents.map(v => v.toString()),
        rewardPerEvent: settings.rewardPerEvent.map(r => ethers.utils.formatEther(r)),
      }
    };
  } catch (error) {
    console.error('Error checking pool:', error);
    throw error;
  }
}

// Run the function
checkPool()
  .then(result => {
    console.log('Pool check completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Pool check failed:', error);
    process.exit(1);
  });