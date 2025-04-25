// scripts/create-pool.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

async function uploadToIPFS(data) {
  try {
    // Save data to a temporary file
    const tempFilePath = path.join(__dirname, 'temp-metadata.json');
    await fs.writeFile(tempFilePath, JSON.stringify(data));
    
    // Create form data
    const formData = new FormData();
    const fileStream = await fs.readFile(tempFilePath);
    formData.append('file', fileStream, {
      filename: 'metadata.json',
      contentType: 'application/json',
    });
    
    // Upload to pinata or web3.storage
    // This is just a placeholder - you'll need to implement the actual upload
    console.log("Would upload to IPFS:", data);
    
    // In a real implementation, you'd use:
    // const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.PINATA_JWT}`,
    //   },
    //   body: formData
    // });
    // const result = await response.json();
    // return result.IpfsHash;
    
    // For now, just return a mock CID
    const mockCid = `mock-cid-${Date.now()}`;
    
    // Cleanup
    await fs.unlink(tempFilePath);
    
    return mockCid;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

async function createPool() {
  try {
    // Import the SDK using dynamic import
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    console.log(`Creating pool on chain ${chainId} with wallet ${wallet.address}`);
    
    // Set up options with just the contract addresses
    const options = {
      network: 'development-celo',
      contracts: {
        DirectPaymentsFactory: process.env.LOCAL_DIRECT_PAYMENTS_FACTORY || '0x998abeb3E57409262aE5b751f60747921B33613E',
        UBIPoolFactory: process.env.LOCAL_UBI_POOL_FACTORY || '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF'
      }
    };
    
    // Initialize SDK with chainId as string
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider, options);
    
    // Project details
    const projectId = 'pesias-kitchen';
    
    // Pool attributes
    const poolAttributes = {
      name: "Pesia's Kitchen",
      description: "A community-driven food rescue program that reduces food waste and ensures food security for vulnerable populations.",
      rewardDescription: "Earn G$ rewards for food rescue, sorting, and distribution activities",
      website: "https://www.pesiaskitchen.org",
      headerImage: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=1200",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
    };
    
    // Pool settings for different activity types
    const poolSettings = {
      validEvents: [1, 2, 3], // Activity types: 1=food_sorting, 2=food_distribution, 3=food_pickup
      rewardPerEvent: [
        ethers.utils.parseEther('1'), // 1 G$ for food sorting
        ethers.utils.parseEther('2'), // 2 G$ for food distribution
        ethers.utils.parseEther('1.5')  // 1.5 G$ for food pickup
      ],
      manager: wallet.address, // The admin wallet address
      membersValidator: ethers.constants.AddressZero, 
      uniquenessValidator: ethers.constants.AddressZero,
      rewardToken: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A', // G$ token on Celo
      allowRewardOverride: false,
    };
    
    // Pool limits
    const poolLimits = {
      maxTotalPerMonth: ethers.utils.parseEther('10000'), // Max G$ rewards per month
      maxMemberPerMonth: ethers.utils.parseEther('100'),  // Max per member per month
      maxMemberPerDay: ethers.utils.parseEther('20'),     // Max per member per day
    };
    
    // Management fee (%)
    const managerFeeBps = 500; // 5% fee
    
    console.log("Creating pool with createPool method");
    
    // Manually upload to IPFS since the SDK's method is failing
    const ipfsCid = await uploadToIPFS(poolAttributes);
    console.log("Uploaded pool attributes to IPFS with CID:", ipfsCid);
    
    // Use createPool method instead of createPoolWithAttributes
    const pool = await sdk.createPool(
      wallet,
      projectId,
      `ipfs://${ipfsCid}`,
      poolSettings,
      poolLimits,
      managerFeeBps,
      true // Create NFT types
    );
    
    console.log('Pool created successfully!');
    console.log('Pool address:', pool.address);
    
    // Save the pool address to your .env file
    try {
      const envContent = await fs.readFile('.env', 'utf8');
      const updatedEnv = envContent.includes('POOL_ADDRESS=') 
        ? envContent.replace(/POOL_ADDRESS=.*$/m, `POOL_ADDRESS=${pool.address}`)
        : envContent + `\nPOOL_ADDRESS=${pool.address}\n`;
      
      await fs.writeFile('.env', updatedEnv);
      console.log('.env file updated with pool address');
    } catch (err) {
      console.log('Could not automatically update .env file:', err.message);
      console.log('Please manually add the pool address to your .env file');
    }
    
    return pool.address;
  } catch (error) {
    console.error('Error creating pool:', error);
    throw error;
  }
}

// Run the function
createPool()
  .then(poolAddress => {
    console.log('Pool creation completed with address:', poolAddress);
    process.exit(0);
  })
  .catch(error => {
    console.error('Pool creation failed:', error);
    process.exit(1);
  });