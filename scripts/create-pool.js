require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

async function uploadToIPFS(data) {
  try {
    const tempFilePath = path.join(__dirname, 'temp-metadata.json');
    await fs.writeFile(tempFilePath, JSON.stringify(data));
    
    const formData = new FormData();
    const fileStream = await fs.readFile(tempFilePath);
    formData.append('file', fileStream, {
      filename: 'metadata.json',
      contentType: 'application/json',
    });
    
    const mockCid = `mock-cid-${Date.now()}`;
    
    await fs.unlink(tempFilePath);
    
    return mockCid;
  } catch (error) {
    throw error;
  }
}

async function createPool() {
  try {
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    const options = {
      network: 'development-celo',
      contracts: {
        DirectPaymentsFactory: process.env.LOCAL_DIRECT_PAYMENTS_FACTORY || '0x998abeb3E57409262aE5b751f60747921B33613E',
        UBIPoolFactory: process.env.LOCAL_UBI_POOL_FACTORY || '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF'
      }
    };
    
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider, options);
    
    const projectId = 'pesias-kitchen';
    
    const poolAttributes = {
      name: "Pesia's Kitchen",
      description: "A community-driven food rescue program that reduces food waste and ensures food security for vulnerable populations.",
      rewardDescription: "Earn G$ rewards for food rescue, sorting, and distribution activities",
      website: "https://www.pesiaskitchen.org",
      headerImage: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=1200",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"
    };
    
    const poolSettings = {
      validEvents: [1, 2, 3],
      rewardPerEvent: [
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('2'),
        ethers.utils.parseEther('1.5')
      ],
      manager: wallet.address,
      membersValidator: ethers.constants.AddressZero, 
      uniquenessValidator: ethers.constants.AddressZero,
      rewardToken: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
      allowRewardOverride: false,
    };
    
    const poolLimits = {
      maxTotalPerMonth: ethers.utils.parseEther('10000'),
      maxMemberPerMonth: ethers.utils.parseEther('100'),
      maxMemberPerDay: ethers.utils.parseEther('20'),
    };
    
    const managerFeeBps = 500;
    
    const ipfsCid = await uploadToIPFS(poolAttributes);
    
    const pool = await sdk.createPool(
      wallet,
      projectId,
      `ipfs://${ipfsCid}`,
      poolSettings,
      poolLimits,
      managerFeeBps,
      true
    );
    
    try {
      const envContent = await fs.readFile('.env', 'utf8');
      const updatedEnv = envContent.includes('POOL_ADDRESS=') 
        ? envContent.replace(/POOL_ADDRESS=.*$/m, `POOL_ADDRESS=${pool.address}`)
        : envContent + `\nPOOL_ADDRESS=${pool.address}\n`;
      
      await fs.writeFile('.env', updatedEnv);
    } catch (err) {
    }
    
    return pool.address;
  } catch (error) {
    throw error;
  }
}



createPool()
  .then(poolAddress => {
    console.log('Pool creation completed with address:', poolAddress);
    process.exit(0);
  })
  .catch(error => {
    console.error('Pool creation failed:', error);
    process.exit(1);
  });