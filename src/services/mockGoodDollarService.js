// // src/services/mockGoodDollarService.js
// const { v4: uuidv4 } = require('uuid');

// /**
//  * Mock service for GoodDollar integration during development
//  */
// exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
//   try {
//     console.log(`[MOCK] Minting NFT for ${userWallet} with activity type ${activityType}`);
    
//     // Calculate mock rewards based on activity type
//     let rewardAmount;
//     switch (activityType) {
//       case 'food_sorting': rewardAmount = 1; break;
//       case 'food_distribution': rewardAmount = 2; break;
//       case 'food_pickup': rewardAmount = 1.5; break;
//       default: rewardAmount = 1;
//     }
    
//     // Generate mock data
//     const mockNftId = `nft-${uuidv4()}`;
//     const mockTxHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
//     const mockIpfsCid = `ipfs-${uuidv4().slice(0, 8)}`;
    
//     console.log(`[MOCK] NFT minted with ID: ${mockNftId}`);
//     console.log(`[MOCK] Rewards: ${rewardAmount} G$`);
    
//     // Simulate blockchain delay
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     return {
//       nftId: mockNftId,
//       txHash: mockTxHash,
//       ipfsCid: mockIpfsCid,
//       rewardAmount
//     };
//   } catch (error) {
//     console.error('[MOCK] Error minting NFT:', error);
//     throw error;
//   }
// };

// /**
//  * Mock function to check user's G$ balance
//  */
// exports.getUserBalance = async (walletAddress) => {
//   // Generate a random balance between 0 and 100
//   const mockBalance = Math.random() * 100;
//   return {
//     address: walletAddress,
//     balance: mockBalance.toFixed(2),
//     symbol: 'G$'
//   };
// };

// /**
//  * Mock function to get pool information
//  */
// exports.getPoolInfo = async () => {
//   const poolAddress = process.env.POOL_ADDRESS;
  
//   return {
//     address: poolAddress,
//     balance: '1000.00', // Mock balance
//     settings: {
//       nftType: '1',
//       manager: process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY).address : '0x187ff8e530DEFaC66e747C2bCEBcEA81B11FfC29',
//       rewardToken: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
//       validEvents: ['1', '2', '3'],
//       rewardPerEvent: ['1.0', '2.0', '1.5'],
//     }
//   };
// };





// src/services/mockGoodDollarService.js
const { v4: uuidv4 } = require('uuid');

/**
 * Mock service for GoodDollar integration during development
 */
exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
  try {
    console.log(`[MOCK] Minting NFT for ${userWallet} with activity type ${activityType}`);
    
    // Calculate mock rewards based on activity type
    let rewardAmount;
    switch (activityType) {
      case 'food_sorting': rewardAmount = 1; break;
      case 'food_distribution': rewardAmount = 2; break;
      case 'food_pickup': rewardAmount = 1.5; break;
      default: rewardAmount = 1;
    }
    
    // Generate mock data
    const mockNftId = `nft-${uuidv4()}`;
    const mockTxHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const mockIpfsCid = `ipfs-${uuidv4().slice(0, 8)}`;
    
    console.log(`[MOCK] NFT minted with ID: ${mockNftId}`);
    console.log(`[MOCK] Rewards: ${rewardAmount} G$`);
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      nftId: mockNftId,
      txHash: mockTxHash,
      ipfsCid: mockIpfsCid,
      rewardAmount
    };
  } catch (error) {
    console.error('[MOCK] Error minting NFT:', error);
    throw error;
  }
};

/**
 * Mock function to check user's G$ balance
 */
exports.getUserBalance = async (walletAddress) => {
  // Generate a random balance between 0 and 100
  const mockBalance = Math.random() * 100;
  return {
    address: walletAddress,
    balance: mockBalance.toFixed(2),
    symbol: 'G$'
  };
};

/**
 * Mock function to get pool information
 */
exports.getPoolInfo = async () => {
  const poolAddress = process.env.POOL_ADDRESS || '0xbd64264aBe852413d30dBf8A3765d7B6DDB04713';
  
  return {
    address: poolAddress,
    balance: '1000.00', // Mock balance
    settings: {
      nftType: '1',
      manager: '0x187ff8e530DEFaC66e747C2bCEBcEA81B11FfC29',
      rewardToken: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
      validEvents: ['1', '2', '3'],
      rewardPerEvent: ['1.0', '2.0', '1.5'],
    }
  };
};