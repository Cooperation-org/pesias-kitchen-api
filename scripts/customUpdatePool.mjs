import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

async function uploadToIPFS(data) {
  try {
    const formData = new FormData();
    const jsonData = JSON.stringify(data);
    
    const buffer = Buffer.from(jsonData);
    formData.append('file', buffer, {
      filename: 'pool.json',
      contentType: 'application/json'
    });

    const response = await axios.post('https://api.thegraph.com/ipfs/api/v0/add?pin=true', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    return response.data.Hash;
  } catch (error) {
    throw error;
  }
}

async function updatePoolDirectly() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    
    const sdk = new GoodCollectiveSDK(chainId, provider, {
      network: 'development-celo'
    });
    
    const poolAddress = '0xbd64264aBe852413d30dBf8A3765d7B6DDB04713';
    
    const poolAttributes = {
      name: 'Pesia\'s Kitchen - EAT Initiative',
      description: 'The EAT Initiative integrates food rescue operations with GoodDollar rewards, using QR code verification and the GoodCollective platform to track volunteer participation and distribute G$ tokens.',
      rewardDescription: "Earn G$ rewards for food rescue, sorting, and distribution activities",
      website: 'https://www.pesiaskitchen.org/',
      headerImage: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=1200",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      updateTimestamp: Date.now()
    };
    
    const ipfsHash = await uploadToIPFS(poolAttributes);
    
    const ipfsUri = `ipfs://${ipfsHash}`;
    
    const factory = sdk.factory;
    if (!factory) {
      throw new Error('Factory contract not found in SDK');
    }
    
    const factoryWithSigner = factory.connect(wallet);
    const tx = await factoryWithSigner.changePoolDetails(poolAddress, ipfsUri);
    
    const receipt = await tx.wait();
    
    try {
      const registryInfo = await factory.registry(poolAddress);
    } catch (verifyError) {
    }
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash,
      ipfsUri
    };
  } catch (error) {
    throw error;
  }
}


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