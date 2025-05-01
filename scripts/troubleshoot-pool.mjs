// scripts/troubleshoot-pool.mjs
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

// Load environment variables
dotenv.config();

async function troubleshootPool() {
  try {
    console.log('========== POOL TROUBLESHOOTING ==========');
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    console.log(`Provider URL: ${process.env.RPC_URL}`);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    console.log(`Chain ID: ${chainId}`);
    
    // Get current block for reference
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block number: ${currentBlock}`);
    
    // Pool address from env
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    console.log(`Pool address: ${poolAddress}`);
    
    // G$ token address on Celo
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; 
    console.log(`G$ token address: ${g$TokenAddress}`);
    
    // 1. First approach: Use SDK with network parameter
    console.log('\n--- METHOD 1: SDK WITH NETWORK PARAMETER ---');
    try {
      const sdk1 = new GoodCollectiveSDK(chainId, provider, {
        network: 'development-celo'
      });
      console.log('SDK initialized with network parameter');
      
      const poolContract1 = sdk1.pool.attach(poolAddress);
      const settings1 = await poolContract1.settings();
      console.log('Settings via SDK with network parameter:', {
        nftType: settings1.nftType.toString(),
        manager: settings1.manager,
        rewardToken: settings1.rewardToken
      });
    } catch (error) {
      console.error(`Error with Method 1: ${error.message}`);
    }
    
    // 2. Second approach: Use SDK without network parameter
    console.log('\n--- METHOD 2: SDK WITHOUT NETWORK PARAMETER ---');
    try {
      const sdk2 = new GoodCollectiveSDK(chainId, provider);
      console.log('SDK initialized without network parameter');
      
      const poolContract2 = sdk2.pool.attach(poolAddress);
      const settings2 = await poolContract2.settings();
      console.log('Settings via SDK without network parameter:', {
        nftType: settings2.nftType.toString(),
        manager: settings2.manager,
        rewardToken: settings2.rewardToken
      });
    } catch (error) {
      console.error(`Error with Method 2: ${error.message}`);
    }
    
    // 3. Third approach: Direct contract call
    console.log('\n--- METHOD 3: DIRECT CONTRACT CALL ---');
    try {
      const poolAbi = [
        'function settings() view returns (uint32 nftType, address manager, address rewardToken)'
      ];
      
      const directPoolContract = new ethers.Contract(poolAddress, poolAbi, provider);
      const settings3 = await directPoolContract.settings();
      console.log('Settings via direct contract call:', {
        nftType: settings3.nftType.toString(),
        manager: settings3.manager,
        rewardToken: settings3.rewardToken
      });
    } catch (error) {
      console.error(`Error with Method 3: ${error.message}`);
    }
    
    // 4. Check token balance
    console.log('\n--- CHECKING POOL TOKEN BALANCE ---');
    try {
      const tokenAbi = [
        'function balanceOf(address account) external view returns (uint256)',
        'function symbol() external view returns (string)'
      ];
      
      const tokenContract = new ethers.Contract(g$TokenAddress, tokenAbi, provider);
      const symbol = await tokenContract.symbol();
      const balance = await tokenContract.balanceOf(poolAddress);
      
      console.log(`Pool balance: ${ethers.utils.formatEther(balance)} ${symbol}`);
    } catch (error) {
      console.error(`Error checking token balance: ${error.message}`);
    }
    
    // 5. Check for proxy implementation
    console.log('\n--- CHECKING FOR PROXY IMPLEMENTATION ---');
    try {
      // EIP-1967 storage slot for implementation
      const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const implementationData = await provider.getStorageAt(poolAddress, implementationSlot);
      
      const implementation = ethers.utils.getAddress('0x' + implementationData.slice(-40));
      console.log(`Possible proxy implementation: ${implementation}`);
      
      if (implementation !== ethers.constants.AddressZero) {
        console.log(`This pool might be a proxy contract. The API might be reading from a different implementation than the script.`);
      } else {
        console.log(`No proxy implementation detected.`);
      }
    } catch (error) {
      console.error(`Error checking for proxy: ${error.message}`);
    }
    
    console.log('\n========== TROUBLESHOOTING COMPLETED ==========');
    console.log(`\nRecommendations:
1. Restart the server to ensure it's reading fresh blockchain state
2. Check the .env file to ensure POOL_ADDRESS is correct: ${poolAddress}
3. Verify that the API and script are using the same provider URL: ${process.env.RPC_URL}
4. Try updating the reward token again using the factory method`);
    
    return {
      success: true,
      message: 'Pool troubleshooting completed'
    };
  } catch (error) {
    console.error(`Error in troubleshooting: ${error.message}`);
    throw error;
  }
}

// Run the function
troubleshootPool()
  .then(result => {
    console.log('\nTroubleshooting completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTroubleshooting failed!', error);
    process.exit(1);
  });