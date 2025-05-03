// const { ethers } = require('ethers');

// const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 42220;

// provider.getBlockNumber().then(
//   blockNumber => console.log('Connected to blockchain, current block:', blockNumber),
//   error => console.error('Failed to connect to blockchain:', error)
// );

// exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
//   try {
//     console.log(`Starting NFT minting for activity ${activityId}...`);
    
//     // For development purposes, create an NFT without blockchain interaction
//     console.log("Using development mode NFT creation");
    
//     // Map activity types to event subtypes for documentation
//     let subtype;
//     switch (activityType) {
//       case 'food_sorting': subtype = 1; break;
//       case 'food_distribution': subtype = 2; break;
//       case 'food_pickup': subtype = 3; break;
//       default: subtype = 1;
//     }
    
//     // Generate a unique NFT ID with a timestamp and random string
//     const timestamp = Date.now();
//     const randomString = Math.random().toString(36).substring(2, 10);
//     const nftId = `nft-${timestamp}-${randomString}`;
    
//     // Create a mock transaction hash
//     const txHash = `0x${Array.from({length: 64}, () => 
//       '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    
//     // Determine reward amount based on activity type
//     let rewardAmount;
//     switch (activityType) {
//       case 'food_sorting': rewardAmount = 1; break;
//       case 'food_distribution': rewardAmount = 2; break;
//       case 'food_pickup': rewardAmount = 1.5; break;
//       default: rewardAmount = 1;
//     }
    
//     console.log(`Created development NFT:`, {
//       nftId,
//       txHash,
//       rewardAmount,
//       activityType,
//       subtype,
//       userWallet
//     });
    
//     return {
//       nftId,
//       txHash,
//       rewardAmount
//     };
//   } catch (error) {
//     console.error('Error in development NFT creation:', error);
//     throw error;
//   }
// };

// exports.getUserBalance = async (walletAddress) => {
//   try {
//     // Import the SDK
//     const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
//     const sdk = new GoodCollectiveSDK(chainId.toString(), provider, { 
//       network: "development-celo" 
//     });
    
//     // Get G$ token contract address
//     const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
    
//     // Create token contract instance
//     const tokenContract = new ethers.Contract(
//       g$TokenAddress,
//       ['function balanceOf(address account) external view returns (uint256)',
//        'function symbol() external view returns (string)'],
//       provider
//     );
    
//     // Get token symbol
//     const symbol = await tokenContract.symbol();
    
//     // Get balance
//     const balance = await tokenContract.balanceOf(walletAddress);
    
//     return {
//       address: walletAddress,
//       balance: ethers.utils.formatEther(balance),
//       symbol: symbol
//     };
//   } catch (error) {
//     console.error('Error checking balance:', error);
//     throw error;
//   }
// };



// exports.getPoolInfo = async () => {
//   console.log("=============== POOL INFO FUNCTION ENTERED ===============");
//   const startTime = Date.now();
//   try {
//     console.log("[POOL INFO] Function execution started at:", new Date().toISOString());
//     console.log("[POOL INFO] Creating timeout promise (30 seconds)");
    
//     // Create a timeout promise
//     const timeoutPromise = new Promise((_, reject) => {
//       setTimeout(() => {
//         console.log("[POOL INFO] ⚠️ TIMEOUT TRIGGERED after 30 seconds");
//         reject(new Error('Blockchain call timed out after 30 seconds'));
//       }, 30000); // 30 second timeout
//     });
    
//     const fetchDataPromise = async () => {
//       console.log("[POOL INFO] 📡 fetchDataPromise started");
//       try {
//         // Import the SDK
//         console.log("[POOL INFO] Importing GoodCollectiveSDK...");
//         const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
//         console.log("[POOL INFO] ✓ SDK import successful");
        
//         console.log("[POOL INFO] Initializing SDK with chainId:", chainId.toString());
//         // Initialize with network parameter
//         const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
//           network: "development-celo"
//         });
//         console.log("[POOL INFO] ✓ SDK successfully initialized");
        
//         // Get pool address from env
//         const poolAddress = process.env.POOL_ADDRESS;
//         console.log("[POOL INFO] Using pool address:", poolAddress);
        
//         if (!poolAddress) {
//           console.log("[POOL INFO] ❌ ERROR: Pool address not defined in environment variables");
//           throw new Error('Pool address not defined in environment');
//         }
        
//         // Get the factory
//         console.log("[POOL INFO] Retrieving factory contract...");
//         const factory = sdk.factory;
//         console.log("[POOL INFO] ✓ Factory retrieved with address:", factory.address);
        
//         // Get registry info directly from the factory
//         console.log("[POOL INFO] Calling factory.registry() for pool:", poolAddress);
//         const registryInfo = await factory.registry(poolAddress).catch(e => {
//           console.log("[POOL INFO] ❌ ERROR getting registry info:", e.message);
//           throw e;
//         });
//         console.log("[POOL INFO] ✓ Registry info retrieved:", JSON.stringify(registryInfo, null, 2));
        
//         // Use the pool attach method from SDK instead of direct contract creation
//         console.log("[POOL INFO] Attaching to pool contract...");
//         const poolContract = sdk.pool.attach(poolAddress);
//         console.log("[POOL INFO] ✓ Pool contract attached");
        
//         // Get settings
//         console.log("[POOL INFO] Calling poolContract.settings()...");
//         const settings = await poolContract.settings().catch(e => {
//           console.log("[POOL INFO] ❌ ERROR getting pool settings:", e.message);
//           throw e;
//         });
//         console.log("[POOL INFO] ✓ Pool settings retrieved:", JSON.stringify({
//           nftType: settings.nftType.toString(),
//           manager: settings.manager,
//           rewardToken: settings.rewardToken
//         }, null, 2));
        
//         // Fetch G$ token balance of the pool
//         console.log("[POOL INFO] Creating token contract for G$ token");
//         const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
//         const tokenContract = new ethers.Contract(
//           g$TokenAddress,
//           ['function balanceOf(address account) external view returns (uint256)'],
//           provider
//         );
//         console.log("[POOL INFO] ✓ G$ token contract created");
        
//         console.log("[POOL INFO] Calling tokenContract.balanceOf() for pool:", poolAddress);
//         const balance = await tokenContract.balanceOf(poolAddress).catch(e => {
//           console.log("[POOL INFO] ❌ ERROR getting token balance:", e.message);
//           throw e;
//         });
//         console.log("[POOL INFO] ✓ Token balance retrieved:", ethers.utils.formatEther(balance), "G$");
        
//         const result = {
//           address: poolAddress,
//           balance: ethers.utils.formatEther(balance),
//           settings: {
//             nftType: settings.nftType.toString(),
//             manager: settings.manager,
//             rewardToken: settings.rewardToken,
//           },
//           registry: {
//             ipfs: registryInfo.ipfs,
//             isVerified: registryInfo.isVerified,
//             projectId: registryInfo.projectId
//           }
//         };
        
//         console.log("[POOL INFO] ✓ All data compiled successfully");
//         return result;
//       } catch (err) {
//         console.error("[POOL INFO] ❌ ERROR in fetchDataPromise:", err.message);
//         console.error("[POOL INFO] Error stack:", err.stack);
//         throw err; // Rethrow to be caught by Promise.race
//       }
//     };

//     // Race the promises
//     console.log("[POOL INFO] 🏁 Starting promise race between fetchDataPromise and timeoutPromise");
//     const result = await Promise.race([fetchDataPromise(), timeoutPromise]);
//     const executionTime = Date.now() - startTime;
//     console.log(`[POOL INFO] ✅ Function completed successfully in ${executionTime}ms`);
//     return result;
//   } catch (error) {
//     const executionTime = Date.now() - startTime;
//     console.error(`[POOL INFO] ❌ ERROR getting pool info (after ${executionTime}ms):`, error.message);
//     console.error("[POOL INFO] Error name:", error.name);
//     console.error("[POOL INFO] Error stack:", error.stack);
//     console.log("=============== POOL INFO FUNCTION FAILED ===============");
//     throw error; // Rethrow the error
//   } finally {
//     console.log(`[POOL INFO] Total execution time: ${Date.now() - startTime}ms`);
//     console.log("=============== POOL INFO FUNCTION EXITED ===============");
//   }
// };




const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 42220;

provider.getBlockNumber().then(
  blockNumber => console.log('Connected to blockchain, current block:', blockNumber),
  error => console.error('Failed to connect to blockchain:', error)
);

// exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
//   try {
//     console.log(`Starting real NFT minting for activity ${activityId}...`);
    
//     // Map activity types to event subtypes
//     let subtype;
//     switch (activityType) {
//       case 'food_sorting': subtype = 1; break;
//       case 'food_distribution': subtype = 2; break;
//       case 'food_pickup': subtype = 3; break;
//       default: subtype = 1;
//     }
    
//     // Import the SDK
//     const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
//     // Initialize SDK with network parameter
//     const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
//       network: "development-celo"
//     });
    
//     // Get pool address from env
//     const poolAddress = process.env.POOL_ADDRESS;
    
//     if (!poolAddress) {
//       throw new Error('Pool address not defined in environment');
//     }
    
//     console.log(`Using pool address: ${poolAddress}`);
//     console.log(`Sending rewards to wallet: ${userWallet}`);
//     console.log(`Activity type: ${activityType} (subtype: ${subtype})`);
//     console.log(`Quantity: ${quantity}kg`);
    
//     // Attach to the pool contract
//     const poolContract = sdk.pool.attach(poolAddress);
    
//     // First check pool settings
//     const settings = await poolContract.settings();
//     console.log('Pool settings:', {
//       nftType: settings.nftType.toString(),
//       manager: settings.manager,
//       rewardToken: settings.rewardToken
//     });
    
//     // Check if we have the necessary role
//     const MANAGER_ROLE = await poolContract.MANAGER_ROLE();
//     const hasRole = await poolContract.hasRole(MANAGER_ROLE, wallet.address);
//     console.log(`Wallet has manager role: ${hasRole}`);
    
//     // Try to mint NFT
//     console.log('Attempting to claim rewards...');
    
//     // Get the signer
//     const signer = wallet;
//     const contractWithSigner = poolContract.connect(signer);
    
//     // Check available functions
//     console.log('Available functions:', Object.keys(contractWithSigner.functions));
    
//     // Look for claim-related functions
//     const claimFunctions = Object.keys(contractWithSigner.functions)
//       .filter(fn => fn.startsWith('claim'));
//     console.log('Claim functions:', claimFunctions);
    
//     // Try the "addClaim" function if available, or generic claim
//     let tx;
//     if (claimFunctions.includes('addClaim(address,uint256,uint256,string)')) {
//       console.log('Using addClaim function...');
//       tx = await contractWithSigner.addClaim(
//         userWallet,   // recipient
//         subtype,      // event type
//         quantity,     // quantity value
//         activityId,   // unique identifier
//         { gasLimit: 500000 }
//       );
//     } else if (claimFunctions.includes('claim(address,uint256,uint256,string)')) {
//       console.log('Using claim function...');
//       tx = await contractWithSigner.claim(
//         userWallet,   // recipient
//         subtype,      // event type
//         quantity,     // quantity value
//         activityId,   // unique identifier
//         { gasLimit: 500000 }
//       );
//     } else {
//       // If no standard claim functions are found, try sending a direct transfer
//       const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
//       const tokenContract = new ethers.Contract(
//         g$TokenAddress,
//         ['function transfer(address to, uint256 amount) returns (bool)'],
//         provider
//       );
      
//       // Calculate reward based on activity type
//       let rewardAmount;
//       switch (activityType) {
//         case 'food_sorting': rewardAmount = 1; break;
//         case 'food_distribution': rewardAmount = 2; break;
//         case 'food_pickup': rewardAmount = 1.5; break;
//         default: rewardAmount = 1;
//       }
      
//       console.log(`Using direct token transfer as fallback: ${rewardAmount} G$`);
//       tx = await tokenContract.connect(signer).transfer(
//         userWallet,
//         ethers.utils.parseEther(rewardAmount.toString()),
//         { gasLimit: 300000 }
//       );
//     }
    
//     console.log(`Transaction submitted: ${tx.hash}`);
//     const receipt = await tx.wait();
//     console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
//     // Determine reward amount based on activity type
//     let rewardAmount;
//     switch (activityType) {
//       case 'food_sorting': rewardAmount = 1; break;
//       case 'food_distribution': rewardAmount = 2; break;
//       case 'food_pickup': rewardAmount = 1.5; break;
//       default: rewardAmount = 1;
//     }
    
//     // Generate NFT ID based on transaction hash
//     const nftId = `nft-${receipt.transactionHash}`;
    
//     return {
//       nftId,
//       txHash: receipt.transactionHash,
//       rewardAmount
//     };
//   } catch (error) {
//     console.error('Error in real NFT minting:', error);
//     throw error;
//   }
// };

exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
  try {
    console.log(`Starting real NFT minting for activity ${activityId}...`);
    
    // Map activity types to event subtypes
    let subtype;
    switch (activityType) {
      case 'food_sorting': subtype = 1; break;
      case 'food_distribution': subtype = 2; break;
      case 'food_pickup': subtype = 3; break;
      default: subtype = 1;
    }
    
    // Import the SDK
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    // Initialize SDK with network parameter
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
      network: "development-celo"
    });
    
    // Get pool address from env
    const poolAddress = process.env.POOL_ADDRESS;
    
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    console.log(`Using pool address: ${poolAddress}`);
    console.log(`Sending rewards to wallet: ${userWallet}`);
    console.log(`Activity type: ${activityType} (subtype: ${subtype})`);
    console.log(`Quantity: ${quantity}kg`);
    
    // Attach to the pool contract
    const poolContract = sdk.pool.attach(poolAddress);
    
    // Get pool settings
    const settings = await poolContract.settings();
    console.log('Pool settings:', {
      nftType: settings.nftType.toString(),
      manager: settings.manager,
      rewardToken: settings.rewardToken
    });
    
    // Connect with the manager wallet
    const contractWithSigner = poolContract.connect(wallet);

    let rewardAmount;
switch (activityType) {
  case 'food_sorting': rewardAmount = 1; break;
  case 'food_distribution': rewardAmount = 2; break;
  case 'food_pickup': rewardAmount = 1.5; break;
  default: rewardAmount = 1;
}
    
    try {
      // Create NFT data structure according to the contract requirements
      const timestamp = Math.floor(Date.now() / 1000);
      const rewardInWei = ethers.utils.parseEther(rewardAmount.toString());

      // Construct the NFT data
      const nftData = {
        nftType: settings.nftType, // Use the pool's NFT type
        version: 1,
        nftUri: `https://pesias-kitchen.org/activities/${activityId}`,
        events: [
          {
            subtype: subtype,
            timestamp: timestamp,
            quantity: 1,
            eventUri: `https://pesias-kitchen.org/events/${activityId}`,
            contributers: [userWallet], 
            rewardOverride: 0
          }
        ]
      };
      
      console.log('Constructed NFT data:', JSON.stringify(nftData));
      
      console.log('Calling mintNFT function...');
      const tx = await contractWithSigner.mintNFT(
        userWallet,        
        nftData,            
        true,               
        { gasLimit: 1000000 }
      );
      
      const receipt = await tx.wait();
   
      
      return {
        nftId,
        txHash: receipt.transactionHash,
        rewardAmount,
        fromPool: true
      };
    } catch (error) {
      console.log(`NFT minting failed: ${error.message}`);
      
      // As a fallback, use direct token transfer if minting fails
      console.log('Using direct token transfer as fallback...');
      
      // Calculate reward amount
      let rewardAmount;
      switch (activityType) {
        case 'food_sorting': rewardAmount = 1; break;
        case 'food_distribution': rewardAmount = 2; break;
        case 'food_pickup': rewardAmount = 1.5; break;
        default: rewardAmount = 1;
      }
      
      // Create token contract instance
      const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
      const tokenContract = new ethers.Contract(
        g$TokenAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        provider
      );
      
      // Transfer tokens directly
      const tx = await tokenContract.connect(wallet).transfer(
        userWallet,
        ethers.utils.parseEther(rewardAmount.toString()),
        { gasLimit: 300000 }
      );
      
      console.log(`Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Create a simulated NFT ID
      const nftId = `nft-${receipt.transactionHash}`;
      
      return {
        nftId,
        txHash: receipt.transactionHash,
        rewardAmount,
        fromPool: false
      };
    }
  } catch (error) {
    console.error('Error in NFT minting process:', error);
    throw error;
  }
};
exports.getPoolInfo = async () => {
  console.log("=============== POOL INFO FUNCTION ENTERED ===============");
  const startTime = Date.now();
  try {
    console.log("[POOL INFO] Function execution started at:", new Date().toISOString());
    console.log("[POOL INFO] Creating timeout promise (30 seconds)");
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log("[POOL INFO] ⚠️ TIMEOUT TRIGGERED after 30 seconds");
        reject(new Error('Blockchain call timed out after 30 seconds'));
      }, 30000); // 30 second timeout
    });
    
    const fetchDataPromise = async () => {
      console.log("[POOL INFO] 📡 fetchDataPromise started");
      try {
        // Import the SDK
        console.log("[POOL INFO] Importing GoodCollectiveSDK...");
        const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
        console.log("[POOL INFO] ✓ SDK import successful");
        
        console.log("[POOL INFO] Initializing SDK with chainId:", chainId.toString());
        // Initialize with network parameter
        const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
          network: "development-celo"
        });
        console.log("[POOL INFO] ✓ SDK successfully initialized");
        
        // Get pool address from env
        const poolAddress = process.env.POOL_ADDRESS;
        console.log("[POOL INFO] Using pool address:", poolAddress);
        
        if (!poolAddress) {
          console.log("[POOL INFO] ❌ ERROR: Pool address not defined in environment variables");
          throw new Error('Pool address not defined in environment');
        }
        
        // Get the factory
        console.log("[POOL INFO] Retrieving factory contract...");
        const factory = sdk.factory;
        console.log("[POOL INFO] ✓ Factory retrieved with address:", factory.address);
        
        // Get registry info directly from the factory
        console.log("[POOL INFO] Calling factory.registry() for pool:", poolAddress);
        const registryInfo = await factory.registry(poolAddress).catch(e => {
          console.log("[POOL INFO] ❌ ERROR getting registry info:", e.message);
          throw e;
        });
        console.log("[POOL INFO] ✓ Registry info retrieved:", JSON.stringify(registryInfo, null, 2));
        
        // Use the pool attach method from SDK instead of direct contract creation
        console.log("[POOL INFO] Attaching to pool contract...");
        const poolContract = sdk.pool.attach(poolAddress);
        console.log("[POOL INFO] ✓ Pool contract attached");
        
        // Get settings
        console.log("[POOL INFO] Calling poolContract.settings()...");
        const settings = await poolContract.settings().catch(e => {
          console.log("[POOL INFO] ❌ ERROR getting pool settings:", e.message);
          throw e;
        });
        console.log("[POOL INFO] ✓ Pool settings retrieved:", JSON.stringify({
          nftType: settings.nftType.toString(),
          manager: settings.manager,
          rewardToken: settings.rewardToken
        }, null, 2));
        
        // Fetch G$ token balance of the pool
        console.log("[POOL INFO] Creating token contract for G$ token");
        const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
        const tokenContract = new ethers.Contract(
          g$TokenAddress,
          ['function balanceOf(address account) external view returns (uint256)'],
          provider
        );
        console.log("[POOL INFO] ✓ G$ token contract created");
        
        console.log("[POOL INFO] Calling tokenContract.balanceOf() for pool:", poolAddress);
        const balance = await tokenContract.balanceOf(poolAddress).catch(e => {
          console.log("[POOL INFO] ❌ ERROR getting token balance:", e.message);
          throw e;
        });
        console.log("[POOL INFO] ✓ Token balance retrieved:", ethers.utils.formatEther(balance), "G$");
        
        const result = {
          address: poolAddress,
          balance: ethers.utils.formatEther(balance),
          settings: {
            nftType: settings.nftType.toString(),
            manager: settings.manager,
            rewardToken: settings.rewardToken,
          },
          registry: {
            ipfs: registryInfo.ipfs,
            isVerified: registryInfo.isVerified,
            projectId: registryInfo.projectId
          }
        };
        
        console.log("[POOL INFO] ✓ All data compiled successfully");
        return result;
      } catch (err) {
        console.error("[POOL INFO] ❌ ERROR in fetchDataPromise:", err.message);
        console.error("[POOL INFO] Error stack:", err.stack);
        throw err; // Rethrow to be caught by Promise.race
      }
    };

    // Race the promises
    console.log("[POOL INFO] 🏁 Starting promise race between fetchDataPromise and timeoutPromise");
    const result = await Promise.race([fetchDataPromise(), timeoutPromise]);
    const executionTime = Date.now() - startTime;
    console.log(`[POOL INFO] ✅ Function completed successfully in ${executionTime}ms`);
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[POOL INFO] ❌ ERROR getting pool info (after ${executionTime}ms):`, error.message);
    console.error("[POOL INFO] Error name:", error.name);
    console.error("[POOL INFO] Error stack:", error.stack);
    console.log("=============== POOL INFO FUNCTION FAILED ===============");
    throw error; // Rethrow the error
  } finally {
    console.log(`[POOL INFO] Total execution time: ${Date.now() - startTime}ms`);
    console.log("=============== POOL INFO FUNCTION EXITED ===============");
  }
};