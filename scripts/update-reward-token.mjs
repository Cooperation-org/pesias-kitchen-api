import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

dotenv.config();

async function updateRewardTokenOnly() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; 
    
    const sdk = new GoodCollectiveSDK(chainId, provider, {
      network: 'development-celo'
    });
    
    const poolContract = sdk.pool.attach(poolAddress);
    
    const currentSettings = await poolContract.settings();

    if (currentSettings.rewardToken.toLowerCase() === g$TokenAddress.toLowerCase()) {
      return {
        success: true,
        message: 'No update needed - already set to G$',
        poolAddress,
        rewardToken: g$TokenAddress
      };
    }

    const factoryInterface = new ethers.utils.Interface([
      'function setPoolRewardToken(address pool, address rewardToken) external'
    ]);
    
    const factoryContract = new ethers.Contract(
      sdk.factory.address,
      factoryInterface,
      wallet
    );
    
    const tx = await factoryContract.setPoolRewardToken(poolAddress, g$TokenAddress, {
      gasLimit: 500000
    });
    
    const receipt = await tx.wait();
    
    const updatedSettings = await poolContract.settings();
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash,
      oldRewardToken: currentSettings.rewardToken,
      newRewardToken: updatedSettings.rewardToken
    };
  } catch (error) {
    throw error;
  }
}


updateRewardTokenOnly()
  .then(result => {
    console.log('\nReward token update completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nReward token update failed!');
    console.error('Final error:', error.message);
    process.exit(1);
  });