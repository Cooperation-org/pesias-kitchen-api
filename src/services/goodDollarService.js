const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 42220;



exports.mintNFT = async (userWallet, activityType, location, quantity, activityId) => {
  try {
    let subtype;
    switch (activityType) {
      case 'food_sorting': subtype = 1; break;
      case 'food_distribution': subtype = 2; break;
      case 'food_pickup': subtype = 3; break;
      default: subtype = 1;
    }
    
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
      network: "development-celo"
    });
    
    const poolAddress = process.env.POOL_ADDRESS;
    
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    const poolContract = sdk.pool.attach(poolAddress);
    
    const settings = await poolContract.settings();
    
    const contractWithSigner = poolContract.connect(wallet);

    let rewardAmount;
    switch (activityType) {
      case 'food_sorting': rewardAmount = 1; break;
      case 'food_distribution': rewardAmount = 2; break;
      case 'food_pickup': rewardAmount = 1.5; break;
      default: rewardAmount = 1;
    }
    
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      ethers.utils.parseEther(rewardAmount.toString());

      const nftData = {
        nftType: settings.nftType,
        version: 1,
        nftUri: `https://pesias-kitchen.org/activities/${activityId}`,
        events: [
          {
            subtype: subtype,
            timestamp: timestamp,
            location: location,
            quantity: 1,
            eventUri: `https://pesias-kitchen.org/events/${activityId}`,
            contributers: [userWallet], 
            rewardOverride: 0
          }
        ]
      };
      
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
      let rewardAmount;
      switch (activityType) {
        case 'food_sorting': rewardAmount = 1; break;
        case 'food_distribution': rewardAmount = 2; break;
        case 'food_pickup': rewardAmount = 1.5; break;
        default: rewardAmount = 1;
      }
      
      const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
      const tokenContract = new ethers.Contract(
        g$TokenAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        provider
      );
      
      const tx = await tokenContract.connect(wallet).transfer(
        userWallet,
        ethers.utils.parseEther(rewardAmount.toString()),
        { gasLimit: 300000 }
      );
      
      const receipt = await tx.wait();
      
      const nftId = `nft-${receipt.transactionHash}`;
      
      return {
        nftId,
        txHash: receipt.transactionHash,
        rewardAmount,
        fromPool: false
      };
    }
  } catch (error) {
    throw error;
  }
};

exports.getPoolInfo = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Blockchain call timed out after 30 seconds'));
      }, 30000);
    });
    
    const fetchDataPromise = async () => {
      try {
        const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
        
        const sdk = new GoodCollectiveSDK(chainId.toString(), provider, {
          network: "development-celo"
        });
        
        const poolAddress = process.env.POOL_ADDRESS;
        
        if (!poolAddress) {
          throw new Error('Pool address not defined in environment');
        }
        
        const factory = sdk.factory;
        
        const registryInfo = await factory.registry(poolAddress).catch(e => {
          throw e;
        });
        
        const poolContract = sdk.pool.attach(poolAddress);
        
        const settings = await poolContract.settings().catch(e => {
          throw e;
        });
        
        const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
        const tokenContract = new ethers.Contract(
          g$TokenAddress,
          ['function balanceOf(address account) external view returns (uint256)'],
          provider
        );
        
        const balance = await tokenContract.balanceOf(poolAddress).catch(e => {
          throw e;
        });
        
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
        
        return result;
      } catch (err) {
        throw err;
      }
    };

    const result = await Promise.race([fetchDataPromise(), timeoutPromise]);
    return result;
  } catch (error) {
    throw error;
  }
};