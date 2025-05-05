import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

dotenv.config();

async function updateExistingPool() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    
    const sdk = new GoodCollectiveSDK(chainId, provider, {
      network: 'development-celo'
    });
    
    const poolAddress = '0x5a8b11f8BE49b8DE02E73e187761A4b9C115fB48';
    
    const poolAttributes = {
      name: 'Pesia\'s Kitchen - EAT Initiative',
      description: 'The EAT Initiative integrates food rescue operations with GoodDollar rewards, using QR code verification and the GoodCollective platform to track volunteer participation and distribute G$ tokens.',
      website: 'https://www.pesiaskitchen.org/',
      headerImage: '',
      logo: ''
    };
    
    const tx = await sdk.updatePoolAttributes(wallet, poolAddress, poolAttributes);
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    throw error;
  }
}

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