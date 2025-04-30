// bypassGasEstimation.mjs
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

// Load environment variables
dotenv.config();

async function createPoolWithManualGas() {
  try {
    console.log('========== CREATING POOL WITH MANUAL GAS LIMIT ==========');
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    console.log(`Provider URL: ${process.env.RPC_URL}`);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    console.log(`Using wallet address: ${wallet.address}`);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    console.log(`Chain ID: ${chainId}`);
    
    // Initialize SDK
    const sdk = new GoodCollectiveSDK(chainId, provider);
    console.log('SDK initialized');
    
    // First approach: Check and set token approvals
    console.log('\n========== CHECKING TOKEN APPROVALS ==========');
    
    const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;
    console.log(`Reward token address: ${rewardTokenAddress}`);
    
    // Try to find the factory contract address
    let factoryAddress = null;
    if (sdk.factory && sdk.factory.address) {
      factoryAddress = sdk.factory.address;
    } else if (sdk.contracts && sdk.contracts.PoolFactory) {
      factoryAddress = sdk.contracts.PoolFactory.address;
    }
    
    if (factoryAddress) {
      console.log(`Found factory address: ${factoryAddress}`);
      
      // Create token contract
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
      
      // Check token balance
      try {
        const symbol = await tokenContract.symbol();
        const balance = await tokenContract.balanceOf(wallet.address);
        console.log(`Token balance: ${ethers.utils.formatEther(balance)} ${symbol}`);
        
        // Check allowance
        const allowance = await tokenContract.allowance(wallet.address, factoryAddress);
        console.log(`Current allowance: ${ethers.utils.formatEther(allowance)} ${symbol}`);
        
        if (allowance.lt(ethers.utils.parseEther('100'))) {
          console.log(`Setting approval for token spending...`);
          
          // Use manual gas limit for approval
          const approveTx = await tokenContract.approve(
            factoryAddress,
            ethers.utils.parseEther('1000'),
            { gasLimit: 100000 }
          );
          
          console.log(`Approval transaction sent: ${approveTx.hash}`);
          const approveReceipt = await approveTx.wait();
          console.log(`Approval transaction confirmed!`);
        } else {
          console.log(`Sufficient allowance already exists`);
        }
      } catch (tokenError) {
        console.log(`Error checking token details: ${tokenError.message}`);
      }
    } else {
      console.log(`Could not find factory address for approvals`);
    }
    
    // Try direct contract call with manual gas limit
    console.log('\n========== ATTEMPTING DIRECT CONTRACT CALL WITH MANUAL GAS ==========');
    
    // Try to get the factory contract directly
    const poolFactory = sdk.factory || sdk.contracts?.PoolFactory;
    
    if (!poolFactory) {
      throw new Error('Could not find pool factory contract');
    }
    
    console.log(`Using pool factory at: ${poolFactory.address}`);
    
    // Connect wallet to factory
    const factoryWithSigner = poolFactory.connect(wallet);
    
    // Generate a unique project ID using timestamp
    const uniqueProjectId = `PesiasKitchen_${Date.now()}`;
    console.log(`Using unique project ID: ${uniqueProjectId}`);
    
    const projectAttributesIpfs = process.env.Full_URI;
    console.log(`IPFS URI: ${projectAttributesIpfs}`);
    
    // Define pool settings with minimal values
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
    
    console.log('Pool settings:', JSON.stringify(poolSettings, null, 2));
    
    // Define pool limits with small values
    const poolLimits = {
      maxTotalPerMonth: ethers.utils.parseEther('10'),
      maxMemberPerMonth: ethers.utils.parseEther('5'),
      maxMemberPerDay: ethers.utils.parseEther('1')
    };
    
    console.log('Pool limits:', JSON.stringify(poolLimits, null, 2));
    
    // Set manual gas limit (very high to ensure it's not the limiting factor)
    const gasOptions = {
      gasLimit: 5000000
    };
    
    console.log(`Using manual gas limit: ${gasOptions.gasLimit}`);
    
    try {
      console.log('Calling createPool directly with manual gas limit...');
      
      const tx = await factoryWithSigner.createPool(
        uniqueProjectId,
        projectAttributesIpfs,
        poolSettings,
        poolLimits,
        gasOptions
      );
      
      console.log(`Transaction sent: ${tx.hash}`);
      console.log('Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Try to extract pool address from events
      const poolCreatedEvent = receipt.events.find(e => e.event === 'PoolCreated');
      if (poolCreatedEvent) {
        const poolAddress = poolCreatedEvent.args.pool;
        console.log(`Pool created at: ${poolAddress}`);
        
        return {
          success: true,
          poolAddress,
          method: 'direct-with-manual-gas'
        };
      } else {
        console.log(`Transaction confirmed but pool address not found in events`);
        return {
          success: true,
          transactionHash: tx.hash,
          method: 'direct-with-manual-gas'
        };
      }
    } catch (directError) {
      console.error(`Direct call failed: ${directError.message}`);
      
      // Try to extract more information from the error
      if (directError.data) {
        console.log(`Error data: ${directError.data}`);
      }
      
      // Try another approach
      console.log('\n========== TRYING WITH DIFFERENT PROJECT ID AND PARAMETERS ==========');
      
      // Try a completely different project ID
      const differentProjectId = `TestPool_${Math.floor(Math.random() * 10000)}`;
      console.log(`Using different project ID: ${differentProjectId}`);
      
      // Even more minimal settings
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
        console.log('Calling createPool with minimal settings and different project ID...');
        
        const tx2 = await factoryWithSigner.createPool(
          differentProjectId,
          projectAttributesIpfs,
          minimalSettings,
          minimalLimits,
          gasOptions
        );
        
        console.log(`Transaction sent: ${tx2.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt2 = await tx2.wait();
        console.log(`Transaction confirmed! Gas used: ${receipt2.gasUsed.toString()}`);
        
        return {
          success: true,
          transactionHash: tx2.hash,
          method: 'minimal-settings'
        };
      } catch (minimalError) {
        console.error(`Minimal settings approach failed: ${minimalError.message}`);
        
        // Try the createBeaconPool function if available
        console.log('\n========== TRYING CREATE BEACON POOL ==========');
        
        if (factoryWithSigner.createBeaconPool) {
          try {
            console.log('Calling createBeaconPool function...');
            
            const tx3 = await factoryWithSigner.createBeaconPool(
              differentProjectId,
              projectAttributesIpfs,
              minimalSettings,
              minimalLimits,
              gasOptions
            );
            
            console.log(`Transaction sent: ${tx3.hash}`);
            console.log('Waiting for confirmation...');
            
            const receipt3 = await tx3.wait();
            console.log(`Transaction confirmed! Gas used: ${receipt3.gasUsed.toString()}`);
            
            return {
              success: true,
              transactionHash: tx3.hash,
              method: 'create-beacon-pool'
            };
          } catch (beaconError) {
            console.error(`Create beacon pool failed: ${beaconError.message}`);
          }
        } else {
          console.log('createBeaconPool function not available');
        }
        
        // If we're still failing, try to analyze the contract more closely
        console.log('\n========== CONTRACT ANALYSIS ==========');
        
        // Check if we need to provide the correct version of parameters
        console.log('Examining contract interface more closely...');
        
        // Look for any other relevant functions
        const allFunctions = Object.keys(factoryWithSigner.interface.functions);
        const possibleRelevantFunctions = allFunctions.filter(f => 
          f.toLowerCase().includes('pool') || 
          f.toLowerCase().includes('create')
        );
        
        console.log(`Other possibly relevant functions: ${possibleRelevantFunctions.join(', ')}`);
        
        console.log('\n========== FINAL RECOMMENDATIONS ==========');
        console.log('1. The error indicates a validation issue in the contract itself.');
        console.log('2. You might need specific permissions or roles to create pools.');
        console.log('3. Try contacting the GoodDollar team for support.');
        console.log('4. Check if there are any requirements for creating pools in their documentation.');
        
        throw new Error('All attempts to create pool failed due to contract validation issues');
      }
    }
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    throw error;
  }
}

// Run the function
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