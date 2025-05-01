// checkPoolAddresses.mjs
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

// Load environment variables
dotenv.config();

async function checkPoolAddresses() {
  try {
    console.log('========== CHECKING SPECIFIC POOL ADDRESSES ==========');
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    console.log(`Provider URL: ${process.env.RPC_URL}`);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    console.log(`Using wallet address: ${wallet.address}`);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    console.log(`Chain ID: ${chainId}`);
    
    // Initialize SDK
    const sdk = new GoodCollectiveSDK(chainId, provider, {
      network: 'development-celo'
    });
    console.log('SDK initialized');
    
    // Pool addresses to check
    const poolAddresses = [
      '0xbd64264aBe852413d30dBf8A3765d7B6DDB04713',
      '0x5a8b11f8BE49b8DE02E73e187761A4b9C115fB48'
    ];
    
    console.log('\n========== CHECKING POOL ADDRESSES ==========');
    
    for (const address of poolAddresses) {
      console.log(`\nChecking address: ${address}`);
      
      try {
        // Try to attach to the address as a pool
        const poolContract = sdk.pool.attach(address);
        
        // Try to call settings() to see if it's a valid pool
        let isValidPool = false;
        let poolSettings;
        let projectId;
        
        try {
          poolSettings = await poolContract.settings();
          console.log('Successfully retrieved pool settings!');
          console.log('Settings:', {
            nftType: poolSettings.nftType.toString(),
            manager: poolSettings.manager,
            rewardToken: poolSettings.rewardToken
          });
          isValidPool = true;
        } catch (settingsError) {
          console.log(`Could not retrieve settings: ${settingsError.message}`);
        }
        
        // Try to get registry info if available
        if (isValidPool && sdk.factory) {
          try {
            const registryInfo = await sdk.factory.registry(address);
            if (registryInfo) {
              console.log('Registry info found:');
              console.log('- IPFS:', registryInfo.ipfs);
              console.log('- Is Verified:', registryInfo.isVerified);
              console.log('- Project ID:', registryInfo.projectId);
              projectId = registryInfo.projectId;
            }
          } catch (registryError) {
            console.log(`Could not retrieve registry info: ${registryError.message}`);
          }
        }
        
        // Check manager role
        if (isValidPool) {
          try {
            // Check if wallet has manager role
            const MANAGER_ROLE = await poolContract.MANAGER_ROLE?.() || 
                                ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MANAGER_ROLE'));
            const hasManagerRole = await poolContract.hasRole(MANAGER_ROLE, wallet.address);
            console.log(`Your wallet has manager role: ${hasManagerRole}`);
            
            if (hasManagerRole) {
              console.log('You can update this pool!');
              
              // Ask if user wants to update this pool
              console.log('\nThis pool can be updated with your existing IPFS URI if needed.');
              console.log(`You would use: sdk.updatePoolAttributes(wallet, "${address}", poolAttributes);`);
            } else {
              console.log('You do not have permission to update this pool.');
              console.log('You would need the MANAGER_ROLE to update it.');
            }
          } catch (roleError) {
            console.log(`Could not check role: ${roleError.message}`);
          }
        }
        
        // Overall result
        if (isValidPool) {
          console.log(`\nRESULT: ✅ ${address} is a valid pool`);
        } else {
          console.log(`\nRESULT: ❌ ${address} does not appear to be a valid pool`);
        }
        
      } catch (contractError) {
        console.log(`Error interacting with contract: ${contractError.message}`);
        console.log(`\nRESULT: ❌ ${address} does not appear to be a valid pool`);
      }
    }
    
    console.log('\n========== CHECKING COMPLETED ==========');
    

    return {
      success: true,
      message: 'Pool address check completed'
    };
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    throw error;
  }
}

// Run the function
checkPoolAddresses()
  .then(result => {
    console.log('\nScript completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nScript failed!');
    console.error('Final error:', error.message);
    process.exit(1);
  });