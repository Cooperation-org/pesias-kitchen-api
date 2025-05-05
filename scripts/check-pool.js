require('dotenv').config();
const { ethers } = require('ethers');

async function checkPool() {
  try {
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
      network: "development-celo"
    });
    
    const poolAddress = process.env.POOL_ADDRESS;
    
    if (!poolAddress) {
      throw new Error('Pool address not found in environment');
    }
    
    const poolContract = sdk.pool.attach(poolAddress);
    
    const settings = await poolContract.settings();
    
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
    const tokenContract = new ethers.Contract(
      g$TokenAddress,
      ['function balanceOf(address account) external view returns (uint256)',
       'function symbol() external view returns (string)'],
      provider
    );
    
    const balance = await tokenContract.balanceOf(poolAddress);
    const symbol = await tokenContract.symbol();
    
    return {
      address: poolAddress,
      balance: ethers.utils.formatEther(balance),
      symbol,
      settings: {
        nftType: settings.nftType.toString(),
        manager: settings.manager,
        rewardToken: settings.rewardToken
      }
    };
  } catch (error) {
    throw error;
  }
}


checkPool()
  .then(result => {
    console.log('Pool check completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Pool check failed:', error);
    process.exit(1);
  });