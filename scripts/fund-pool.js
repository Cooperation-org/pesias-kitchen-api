// // scripts/fund-pool.js
// require('dotenv').config();
// const { ethers } = require('ethers');

// async function fundPool() {
//   try {
//     // Initialize provider and wallet
//     const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
//     const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
//     console.log(`Funding pool with wallet ${wallet.address}`);
    
//     const poolAddress = process.env.POOL_ADDRESS;
//     if (!poolAddress) {
//       throw new Error('Pool address not defined in environment');
//     }
    
//     // Amount to fund (in G$)
//     const amount = ethers.utils.parseEther('1000'); // 1000 G$
    
//     // Get token contract
//     const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
//     const tokenContract = new ethers.Contract(
//       g$TokenAddress,
//       ['function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool)'],
//       wallet
//     );
    
//     // Fund the pool using transferAndCall (ERC677 standard)
//     console.log(`Funding pool ${poolAddress} with ${ethers.utils.formatEther(amount)} G$`);
//     const tx = await tokenContract.transferAndCall(poolAddress, amount, '0x');
//     const receipt = await tx.wait();
    
//     console.log(`Pool funded successfully! Transaction hash: ${receipt.transactionHash}`);
//     return receipt.transactionHash;
//   } catch (error) {
//     console.error('Error funding pool:', error);
//     throw error;
//   }
// }

// // Run the function
// fundPool()
//   .then(txHash => {
//     console.log('Pool funding completed with transaction:', txHash);
//     process.exit(0);
//   })
//   .catch(error => {
//     console.error('Pool funding failed:', error);
//     process.exit(1);
//   });


// scripts/fund-pool.js
require('dotenv').config();
const { ethers } = require('ethers');

async function fundPool() {
  try {
    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    console.log(`Funding pool on chain ${chainId} with wallet ${wallet.address}`);
    
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    // Amount to fund (in G$)
    const amount = ethers.utils.parseEther('100'); // 100 G$
    
    // Get token contract
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A'; // G$ on Celo
    const tokenContract = new ethers.Contract(
      g$TokenAddress,
      ['function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool)'],
      wallet
    );
    
    // Fund the pool using transferAndCall (ERC677 standard)
    console.log(`Funding pool ${poolAddress} with ${ethers.utils.formatEther(amount)} G$`);
    const tx = await tokenContract.transferAndCall(poolAddress, amount, '0x');
    const receipt = await tx.wait();
    
    console.log(`Pool funded successfully! Transaction hash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error funding pool:', error);
    throw error;
  }
}

// Run the function
fundPool()
  .then(txHash => {
    console.log('Pool funding completed with transaction:', txHash);
    process.exit(0);
  })
  .catch(error => {
    console.error('Pool funding failed:', error);
    process.exit(1);
  });