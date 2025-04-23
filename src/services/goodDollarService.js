
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