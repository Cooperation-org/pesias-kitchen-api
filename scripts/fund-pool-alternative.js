// scripts/fund-pool-alternative.js
require('dotenv').config();
const { ethers } = require('ethers');

async function fundPool() {
  try {
    // Import the SDK
    const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
    
    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    console.log(`Funding pool on chain ${chainId} with wallet ${wallet.address}`);
    
    // Initialize SDK with chainId as string
    const sdk = new GoodCollectiveSDK(chainId.toString(), provider);
    
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    // Amount to fund (in G$)
    const amount = ethers.utils.parseEther('100').toString(); // 100 G$
    
    // Use supportSingleTransferAndCall method from SDK
    console.log(`Funding pool ${poolAddress} with ${amount} G$ using supportSingleTransferAndCall`);
    const tx = await sdk.supportSingleTransferAndCall(wallet, poolAddress, amount);
    
    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    
    console.log(`Pool funded successfully! Transaction hash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error funding pool with supportSingleTransferAndCall:', error);
    
    // Try another method if first one fails
    console.log('Trying supportSingleBatch method...');
    try {
      const { GoodCollectiveSDK } = await import('@gooddollar/goodcollective-sdk');
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const chainId = parseInt(process.env.CHAIN_ID || '42220');
      
      const sdk = new GoodCollectiveSDK(chainId.toString(), provider);
      const poolAddress = process.env.POOL_ADDRESS;
      const amount = ethers.utils.parseEther('100').toString();
      
      const tx = await sdk.supportSingleBatch(wallet, poolAddress, amount);
      const receipt = await tx.wait();
      
      console.log(`Pool funded successfully using supportSingleBatch! Transaction hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (batchError) {
      console.error('Error funding pool with supportSingleBatch:', batchError);
      throw batchError;
    }
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