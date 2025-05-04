import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

dotenv.config();

async function troubleshootPool() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    
    await provider.getBlockNumber();
    
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; 
    
    try {
      const sdk1 = new GoodCollectiveSDK(chainId, provider, {
        network: 'development-celo'
      });
      
      const poolContract1 = sdk1.pool.attach(poolAddress);
      
       await poolContract1.settings();
    } catch (error) {
    }
    
    try {
      const sdk2 = new GoodCollectiveSDK(chainId, provider);
      
      const poolContract2 = sdk2.pool.attach(poolAddress);
       await poolContract2.settings();
    } catch (error) {
    }
    
    try {
      const poolAbi = [
        'function settings() view returns (uint32 nftType, address manager, address rewardToken)'
      ];
      
      const directPoolContract = new ethers.Contract(poolAddress, poolAbi, provider);
       await directPoolContract.settings();
    } catch (error) {
    }
    
    try {
      const tokenAbi = [
        'function balanceOf(address account) external view returns (uint256)',
        'function symbol() external view returns (string)'
      ];
      
      const tokenContract = new ethers.Contract(g$TokenAddress, tokenAbi, provider);
       await tokenContract.symbol();
       await tokenContract.balanceOf(poolAddress);
    } catch (error) {
    }
    
    try {
      const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const implementationData = await provider.getStorageAt(poolAddress, implementationSlot);
      
      ethers.utils.getAddress('0x' + implementationData.slice(-40));
    } catch (error) {
    }
    
    return {
      success: true,
      message: 'Pool troubleshooting completed'
    };
  } catch (error) {
    throw error;
  }
}

troubleshootPool()
  .then(result => {
    console.log('\nTroubleshooting completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTroubleshooting failed!', error);
    process.exit(1);
  });