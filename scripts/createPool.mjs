import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

dotenv.config();

async function createPoolWithManualGas() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    
    const sdk = new GoodCollectiveSDK(chainId, provider);
    
    const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;
    
    let factoryAddress = null;
    if (sdk.factory && sdk.factory.address) {
      factoryAddress = sdk.factory.address;
    } else if (sdk.contracts && sdk.contracts.PoolFactory) {
      factoryAddress = sdk.contracts.PoolFactory.address;
    }
    
    if (factoryAddress) {
      const tokenContract = new ethers.Contract(
        rewardTokenAddress,
        [
          'function allowance(address,address) view returns (uint256)',
          'function approve(address,uint256) returns (bool)',
          'function balanceOf(address) view returns (uint256)',
          'function symbol() view returns (string)'
        ],
        wallet
      );
      
      try {
         await tokenContract.symbol();
         await tokenContract.balanceOf(wallet.address);
        
        const allowance = await tokenContract.allowance(wallet.address, factoryAddress);
        
        if (allowance.lt(ethers.utils.parseEther('100'))) {
          const approveTx = await tokenContract.approve(
            factoryAddress,
            ethers.utils.parseEther('1000'),
            { gasLimit: 100000 }
          );
          
          await approveTx.wait();
        }
      } catch (tokenError) {
      }
    }
    
    const poolFactory = sdk.factory || sdk.contracts?.PoolFactory;
    
    if (!poolFactory) {
      throw new Error('Could not find pool factory contract');
    }
    
    const factoryWithSigner = poolFactory.connect(wallet);
    
    const uniqueProjectId = `PesiasKitchen_${Date.now()}`;
    
    const projectAttributesIpfs = process.env.Full_URI;
    
    const poolSettings = {
      nftType: 0,
      validEvents: [1],
      rewardPerEvent: [ethers.utils.parseEther('1')],
      manager: wallet.address,
      membersValidator: ethers.constants.AddressZero,
      rewardToken: rewardTokenAddress,
      uniquenessValidator: ethers.constants.AddressZero,
      allowRewardOverride: false
    };
    
    const poolLimits = {
      maxTotalPerMonth: ethers.utils.parseEther('10'),
      maxMemberPerMonth: ethers.utils.parseEther('5'),
      maxMemberPerDay: ethers.utils.parseEther('1')
    };
    
    const gasOptions = {
      gasLimit: 5000000
    };
    
    try {
      const tx = await factoryWithSigner.createPool(
        uniqueProjectId,
        projectAttributesIpfs,
        poolSettings,
        poolLimits,
        gasOptions
      );
      
      const receipt = await tx.wait();
      
      const poolCreatedEvent = receipt.events.find(e => e.event === 'PoolCreated');
      if (poolCreatedEvent) {
        const poolAddress = poolCreatedEvent.args.pool;
        
        return {
          success: true,
          poolAddress,
          method: 'direct-with-manual-gas'
        };
      } else {
        return {
          success: true,
          transactionHash: tx.hash,
          method: 'direct-with-manual-gas'
        };
      }
    } catch (directError) {
      const differentProjectId = `TestPool_${Math.floor(Math.random() * 10000)}`;
      
      const minimalSettings = {
        manager: wallet.address,
        rewardPerEvent: [1],
        validEvents: [1],
        rewardToken: rewardTokenAddress,
        membersValidator: ethers.constants.AddressZero,
        uniquenessValidator: ethers.constants.AddressZero
      };
      
      const minimalLimits = {
        maxMemberPerDay: 1,
        maxMemberPerMonth: 10,
        maxTotalPerMonth: 100
      };
      
      try {
        const tx2 = await factoryWithSigner.createPool(
          differentProjectId,
          projectAttributesIpfs,
          minimalSettings,
          minimalLimits,
          gasOptions
        );
        
         await tx2.wait();
        
        return {
          success: true,
          transactionHash: tx2.hash,
          method: 'minimal-settings'
        };
      } catch (minimalError) {
        if (factoryWithSigner.createBeaconPool) {
          try {
            const tx3 = await factoryWithSigner.createBeaconPool(
              differentProjectId,
              projectAttributesIpfs,
              minimalSettings,
              minimalLimits,
              gasOptions
            );
            
             await tx3.wait();
            
            return {
              success: true,
              transactionHash: tx3.hash,
              method: 'create-beacon-pool'
            };
          } catch (beaconError) {
          }
        }
        
        const allFunctions = Object.keys(factoryWithSigner.interface.functions);
        const possibleRelevantFunctions = allFunctions.filter(f => 
          f.toLowerCase().includes('pool') || 
          f.toLowerCase().includes('create')
        );
        
        throw new Error('All attempts to create pool failed due to contract validation issues');
      }
    }
  } catch (error) {
    throw error;
  }
}


createPoolWithManualGas()
  .then(result => {
    console.log('\nPool creation completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nPool creation failed!');
    console.error('Final error:', error.message);
    process.exit(1);
  });