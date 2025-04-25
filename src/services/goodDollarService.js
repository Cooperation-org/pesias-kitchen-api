
// const { ethers } = require('ethers');
// // Replace this:
// // const { GoodCollectiveSDK } = require('@gooddollar/goodcollective-sdk');

// const RPC_URL = process.env.RPC_URL;
// const PRIVATE_KEY = process.env.PRIVATE_KEY;

// if (!RPC_URL) {
//   console.error('RPC_URL is not defined in environment variables');
// }

// if (!PRIVATE_KEY) {
//   console.error('PRIVATE_KEY is not defined in environment variables');
// }

// // Initialize provider and signer
// const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 42220; // Default to Celo Mainnet

// exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
//   try {
//     // Dynamically import the ES module
//     const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
//     const sdk = new GoodCollectiveSDK(chainId, provider);
    
//     // Get pool address from env
//     const poolAddress = process.env.POOL_ADDRESS;
    
//     if (!poolAddress) {
//       throw new Error('Pool address not defined in environment');
//     }
    
//     // Get the pool
//     const pool = await sdk.getPool(poolAddress);
//     const assignedType = (await pool.settings()).nftType;
    
//     // Create metadata for IPFS
//     const metadata = {
//       name: `Pesia's Kitchen - ${activityType}`,
//       description: `Food rescue activity at ${location} with quantity ${quantity}kg`,
//       attributes: [
//         { trait_type: 'Activity Type', value: activityType },
//         { trait_type: 'Location', value: location },
//         { trait_type: 'Quantity', value: quantity },
//         { trait_type: 'Activity ID', value: activityId }
//       ]
//     };
    
//     // Convert metadata to string
//     const metadataStr = JSON.stringify(metadata);
    
//     // Upload to IPFS
//     const ipfsService = require('./ipfsService.js');
//     const ipfsCid = await ipfsService.uploadToIPFS(metadataStr);
    
//     // Prepare NFT data
//     const nftData = {
//       nftType: assignedType,
//       nftUri: `ipfs://${ipfsCid}`,
//       version: 1,
//       events: [
//         {
//           eventUri: `ipfs://${ipfsCid}`,
//           subtype: 1, // Activity type ID
//           contributers: [userWallet],
//           timestamp: Math.floor(Date.now() / 1000),
//           quantity: ethers.BigNumber.from(quantity),
//         },
//       ],
//     };
    
//     // Mint the NFT
//     const nft = await sdk.mintNft(
//       wallet,
//       poolAddress,
//       userWallet,
//       nftData,
//       true // Claim rewards immediately
//     );
    
//     const tx = await nft.wait();
    
//     // Extract NFT ID from transaction logs (this is simplified)
//     // In a real implementation, you'd need to decode the logs to get the actual NFT ID
//     const nftId = `nft-${Date.now()}`;
    
//     return {
//       nftId,
//       txHash: tx.transactionHash,
//       ipfsCid
//     };
//   } catch (error) {
//     console.error('Error minting NFT:', error);
//     throw error;
//   }
// };



// src/services/goodDollarService.js
const { ethers } = require('ethers');

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 42220;

exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
  try {
    // Import the SDK
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    const sdk = new GoodCollectiveSDK(chainId, provider);
    
    // Get pool address from env
    const poolAddress = process.env.POOL_ADDRESS;
    
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    // Get the pool
    const pool = await sdk.getPool(poolAddress);
    const settings = await pool.settings();
    const assignedType = settings.nftType;
    
    // Map activity types to event subtypes
    let subtype;
    switch (activityType) {
      case 'food_sorting':
        subtype = 1;
        break;
      case 'food_distribution':
        subtype = 2;
        break;
      case 'food_pickup':
        subtype = 3;
        break;
      default:
        subtype = 1;
    }
    
    // Create metadata for IPFS
    const metadata = {
      name: `Pesia's Kitchen - ${activityType}`,
      description: `Food rescue activity at ${location} with quantity ${quantity}kg`,
      attributes: [
        { trait_type: 'Activity Type', value: activityType },
        { trait_type: 'Location', value: location },
        { trait_type: 'Quantity', value: quantity },
        { trait_type: 'Activity ID', value: activityId }
      ]
    };
    
    // Convert metadata to string
    const metadataStr = JSON.stringify(metadata);
    
    // Upload to IPFS
    const ipfsService = require('./ipfsService.js');
    const ipfsCid = await ipfsService.uploadToIPFS(metadataStr);
    
    // Prepare NFT data
    const nftData = {
      nftType: assignedType,
      nftUri: `ipfs://${ipfsCid}`,
      version: 1,
      events: [
        {
          eventUri: `ipfs://${ipfsCid}`,
          subtype: subtype,
          contributers: [userWallet],
          timestamp: Math.floor(Date.now() / 1000),
          quantity: ethers.BigNumber.from(quantity),
        },
      ],
    };
    
    console.log(`Minting NFT for ${userWallet} with activity type ${activityType} (subtype ${subtype})`);
    
    // Mint the NFT
    const tx = await sdk.mintNft(
      wallet,
      poolAddress,
      userWallet,
      nftData,
      true // Claim rewards immediately
    );
    
    const receipt = await tx.wait();
    
    // This is simplified - in production you'd decode logs to get the NFT ID
    const nftId = `nft-${Date.now()}`;
    
    console.log(`NFT minted with transaction hash: ${receipt.transactionHash}`);
    
    return {
      nftId,
      txHash: receipt.transactionHash,
      ipfsCid
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
};

