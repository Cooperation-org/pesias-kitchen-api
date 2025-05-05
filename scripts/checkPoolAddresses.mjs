import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { GoodCollectiveSDK } from '@gooddollar/goodcollective-sdk';

dotenv.config();

async function checkPoolAddresses() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
    
    const chainId = parseInt(process.env.CHAIN_ID);
    
    const sdk = new GoodCollectiveSDK(chainId, provider, {
      network: 'development-celo'
    });
    
    const poolAddresses = [
      '0xbd64264aBe852413d30dBf8A3765d7B6DDB04713',
      '0x5a8b11f8BE49b8DE02E73e187761A4b9C115fB48'
    ];
    
    for (const address of poolAddresses) {
      try {
        const poolContract = sdk.pool.attach(address);
        
        let isValidPool = false;
        let poolSettings;
        let projectId;
        
        try {
          poolSettings = await poolContract.settings();
          isValidPool = true;
        } catch (settingsError) {
        }
        
        if (isValidPool && sdk.factory) {
          try {
            const registryInfo = await sdk.factory.registry(address);
            if (registryInfo) {
              projectId = registryInfo.projectId;
            }
          } catch (registryError) {
          }
        }
        
        if (isValidPool) {
          try {
            const MANAGER_ROLE = await poolContract.MANAGER_ROLE?.() || 
                                ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MANAGER_ROLE'));
            const hasManagerRole = await poolContract.hasRole(MANAGER_ROLE, wallet.address);
          } catch (roleError) {
          }
        }
      } catch (contractError) {
      }
    }

    return {
      success: true,
      message: 'Pool address check completed'
    };
  } catch (error) {
    throw error;
  }
}

checkPoolAddresses()
  .then(result => {
    console.log('\nScript completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nScript failed!');
    console.error('Final error:', error.message);
    process.exit(1);
  });