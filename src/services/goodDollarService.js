const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 42220;

provider.getBlockNumber().then(
  blockNumber => console.log('Connected to blockchain, current block:', blockNumber),
  error => console.error('Failed to connect to blockchain:', error)
);

exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
  try {
    console.log(`Starting NFT minting for activity ${activityId}...`);
    
    // For development purposes, create an NFT without blockchain interaction
    console.log("Using development mode NFT creation");
    
    // Map activity types to event subtypes for documentation
    let subtype;
    switch (activityType) {
      case 'food_sorting': subtype = 1; break;
      case 'food_distribution': subtype = 2; break;
      case 'food_pickup': subtype = 3; break;
      default: subtype = 1;
    }
    
    // Generate a unique NFT ID with a timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const nftId = `nft-${timestamp}-${randomString}`;
    
    // Create a mock transaction hash
    const txHash = `0x${Array.from({length: 64}, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    
    // Determine reward amount based on activity type
    let rewardAmount;
    switch (activityType) {
      case 'food_sorting': rewardAmount = 1; break;
      case 'food_distribution': rewardAmount = 2; break;
      case 'food_pickup': rewardAmount = 1.5; break;
      default: rewardAmount = 1;
    }
    
    console.log(`Created development NFT:`, {
      nftId,
      txHash,
      rewardAmount,
      activityType,
      subtype,
      userWallet
    });
    
    return {
      nftId,
      txHash,
      rewardAmount
    };
  } catch (error) {
    console.error('Error in development NFT creation:', error);
    throw error;
  }
};

exports.getUserBalance = async (walletAddress) => {
  try {
    // Import the SDK
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider, { 
      network: "development-celo" 
    });
    
    // Get G$ token contract address
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
    
    // Create token contract instance
    const tokenContract = new ethers.Contract(
      g$TokenAddress,
      ['function balanceOf(address account) external view returns (uint256)',
       'function symbol() external view returns (string)'],
      provider
    );
    
    // Get token symbol
    const symbol = await tokenContract.symbol();
    
    // Get balance
    const balance = await tokenContract.balanceOf(walletAddress);
    
    return {
      address: walletAddress,
      balance: ethers.utils.formatEther(balance),
      symbol: symbol
    };
  } catch (error) {
    console.error('Error checking balance:', error);
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