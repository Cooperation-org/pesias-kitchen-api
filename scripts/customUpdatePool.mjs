// customUpdatePool.mjs
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';
import axios from 'axios';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

// Custom IPFS upload function
async function uploadToIPFS(data) {
  console.log('Starting uploadToIPFS with data:', data);
  try {
    const formData = new FormData();
    const jsonData = JSON.stringify(data);
    console.log('Stringified JSON data:', jsonData);
    
    // Create Buffer from the JSON data
    const buffer = Buffer.from(jsonData);
    formData.append('file', buffer, {
      filename: 'pool.json',
      contentType: 'application/json'
    });
    console.log('FormData object created');

    // Make the IPFS upload request
    const response = await axios.post('https://api.thegraph.com/ipfs/api/v0/add?pin=true', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    console.log('IPFS upload response:', response.data);

    // Return the IPFS hash
    return response.data.Hash;
  } catch (error) {
    console.error('Error in uploadToIPFS:', error);
    throw error;
  }
}

async function updatePoolDirectly() {
  try {
    console.log('========== UPDATING POOL WITH CUSTOM IPFS UPLOAD ==========');
    
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
    
    // Use the first pool address
    const poolAddress = '0xbd64264aBe852413d30dBf8A3765d7B6DDB04713';
    console.log(`Updating pool at address: ${poolAddress}`);
    
    // Define updated pool attributes
    const poolAttributes = {
      name: 'Pesia\'s Kitchen - EAT Initiative',
      description: 'The EAT Initiative integrates food rescue operations with GoodDollar rewards, using QR code verification and the GoodCollective platform to track volunteer participation and distribute G$ tokens.',
      rewardDescription: "Earn G$ rewards for food rescue, sorting, and distribution activities",
      website: 'https://www.pesiaskitchen.org/',
      headerImage: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=1200",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      // You can add other attributes as needed
      updateTimestamp: Date.now() // Add a timestamp to ensure uniqueness
    };
    
    console.log('Pool attributes defined:', poolAttributes);
    
    // Upload to IPFS using custom function
    console.log('Uploading to IPFS...');
    const ipfsHash = await uploadToIPFS(poolAttributes);
    console.log(`IPFS upload successful! Hash: ${ipfsHash}`);
    
    // Format the IPFS URI
    const ipfsUri = `ipfs://${ipfsHash}`;
    console.log(`IPFS URI: ${ipfsUri}`);
    
    // Use the factory's changePoolDetails method directly
    console.log('Getting factory contract...');
    const factory = sdk.factory;
    if (!factory) {
      throw new Error('Factory contract not found in SDK');
    }
    
    console.log('Factory address:', factory.address);
    console.log('Updating pool details...');
    
    // Connect wallet to factory and update pool details
    const factoryWithSigner = factory.connect(wallet);
    const tx = await factoryWithSigner.changePoolDetails(poolAddress, ipfsUri);
    
    console.log(`Update transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`Update transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
    
    console.log('Pool updated successfully!');
    
    // Now check if the update was successful
    try {
      console.log('\nVerifying update...');
      const registryInfo = await factory.registry(poolAddress);
      console.log('Updated registry info:');
      console.log('- IPFS:', registryInfo.ipfs);
      console.log('- Is Verified:', registryInfo.isVerified);
      console.log('- Project ID:', registryInfo.projectId);
      
      if (registryInfo.ipfs === ipfsUri) {
        console.log('✅ Update verified! Pool is now using the new IPFS URI');
      } else {
        console.log('⚠️ Pool IPFS URI does not match what we set. This might be a delay in indexing.');
      }
    } catch (verifyError) {
      console.log(`Error verifying update: ${verifyError.message}`);
    }
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash,
      ipfsUri
    };
  } catch (error) {
    console.error(`Error updating pool: ${error.message}`);
    
    // More detailed error information
    if (error.reason) console.error('Reason:', error.reason);
    if (error.code) console.error('Error code:', error.code);
    
    // If it's an axios error, show more details
    if (error.isAxiosError) {
      console.error('Axios error details:');
      console.error('- Status:', error.response?.status);
      console.error('- Data:', error.response?.data);
    }
    
    throw error;
  }
}

// Run the function
updatePoolDirectly()
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