// scripts/update-reward-token-only.mjs
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

// Load environment variables
dotenv.config();

async function updateRewardTokenOnly() {
  try {
    console.log('========== UPDATING POOL REWARD TOKEN ONLY ==========');
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    console.log(`Provider URL: ${process.env.RPC_URL}`);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    console.log(`Using wallet address: ${wallet.address}`);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    console.log(`Chain ID: ${chainId}`);
    
    // Pool address from env
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    console.log(`Pool address: ${poolAddress}`);
    
    // G$ token address on Celo
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; 
    console.log(`G$ token address: ${g$TokenAddress}`);
    
    // Initialize SDK
    const sdk = new GoodCollectiveSDK(chainId, provider, {
      network: 'development-celo'
    });
    console.log('SDK initialized');
    
    // Get pool contract
    console.log('Getting pool contract...');
    const poolContract = sdk.pool.attach(poolAddress);
    
    // Get current settings
    console.log('Getting current settings...');
    const currentSettings = await poolContract.settings();
    console.log('Current settings:', {
      nftType: currentSettings.nftType.toString(),
      manager: currentSettings.manager,
      rewardToken: currentSettings.rewardToken
    });

    // Check if update is needed
    if (currentSettings.rewardToken.toLowerCase() === g$TokenAddress.toLowerCase()) {
      console.log('✅ Reward token is already set to G$. No update needed.');
      return {
        success: true,
        message: 'No update needed - already set to G$',
        poolAddress,
        rewardToken: g$TokenAddress
      };
    }

    // Use the factory to update reward token
    console.log('Using factory to update reward token...');
    
    // Create interface for the factory
    const factoryInterface = new ethers.utils.Interface([
      'function setPoolRewardToken(address pool, address rewardToken) external'
    ]);
    
    // Connect wallet to factory contract
    const factoryContract = new ethers.Contract(
      sdk.factory.address,
      factoryInterface,
      wallet
    );
    
    console.log(`Setting pool reward token to ${g$TokenAddress}...`);
    
    // Set the reward token with explicit gas limit
    const tx = await factoryContract.setPoolRewardToken(poolAddress, g$TokenAddress, {
      gasLimit: 500000  // Add explicit gas limit to avoid estimation errors
    });
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verify the update
    console.log('Verifying update...');
    const updatedSettings = await poolContract.settings();
    console.log('Updated settings:', {
      nftType: updatedSettings.nftType.toString(),
      manager: updatedSettings.manager,
      rewardToken: updatedSettings.rewardToken
    });
    
    // Check if successful
    if (updatedSettings.rewardToken.toLowerCase() === g$TokenAddress.toLowerCase()) {
      console.log('✅ Reward token successfully updated to G$!');
    } else {
      console.log('⚠️ Reward token was not updated correctly.');
    }
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash,
      oldRewardToken: currentSettings.rewardToken,
      newRewardToken: updatedSettings.rewardToken
    };
  } catch (error) {
    console.error(`Error updating reward token: ${error.message}`);
    if (error.reason) console.error('Reason:', error.reason);
    if (error.code) console.error('Error code:', error.code);
    throw error;
  }
}

// Run the function
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