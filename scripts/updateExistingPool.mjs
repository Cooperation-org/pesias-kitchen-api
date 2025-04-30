// updateExistingPool.mjs
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

// Load environment variables
dotenv.config();

async function updateExistingPool() {
  try {
    console.log('========== UPDATING EXISTING POOL ==========');
    
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
    
    // Pool address to update - use pool 2 since it already has the right IPFS URI
    const poolAddress = '0x5a8b11f8BE49b8DE02E73e187761A4b9C115fB48';
    console.log(`Updating pool at address: ${poolAddress}`);
    
    // Define updated pool attributes (modify as needed)
    const poolAttributes = {
      name: 'Pesia\'s Kitchen - EAT Initiative',
      description: 'The EAT Initiative integrates food rescue operations with GoodDollar rewards, using QR code verification and the GoodCollective platform to track volunteer participation and distribute G$ tokens.',
      website: 'https://www.pesiaskitchen.org/',
      headerImage: '', // Add URL if you have one
      logo: ''         // Add URL if you have one
    };
    
    console.log('Updating pool with attributes:', poolAttributes);
    
    // Update the pool
    console.log('Sending update transaction...');
    const tx = await sdk.updatePoolAttributes(wallet, poolAddress, poolAttributes);
    
    console.log(`Update transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`Update transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
    
    console.log('Pool updated successfully!');
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error(`Error updating pool: ${error.message}`);
    throw error;
  }
}

// Run the function
updateExistingPool()
  .then(result => {
    console.log('\nPool update completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nPool update failed!');
    console.error('Final error:', error.message);
    process.exit(1);
  });