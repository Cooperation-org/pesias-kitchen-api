
// scripts/fund-pool.js
require('dotenv').config();
const { ethers } = require('ethers');

async function fundPool() {
  try {
    console.log('========== FUNDING POOL WITH G$ TOKENS ==========');
    
    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    console.log(`Network Chain ID: ${chainId}`);
    console.log(`Using wallet: ${wallet.address}`);
    
    // Get pool address from env
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    console.log(`Target pool: ${poolAddress}`);
    
    // G$ token address on Celo
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
    console.log(`G$ token address: ${g$TokenAddress}`);
    
    // Create token contract
    const tokenAbi = [
      'function balanceOf(address account) external view returns (uint256)',
      'function symbol() external view returns (string)',
      'function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool)'
    ];
    
    const tokenContract = new ethers.Contract(g$TokenAddress, tokenAbi, provider);
    const symbol = await tokenContract.symbol();
    
    // Check wallet balance
    const walletBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`Current wallet balance: ${ethers.utils.formatEther(walletBalance)} ${symbol}`);
    
    // Check pool balance before funding
    const poolBalanceBefore = await tokenContract.balanceOf(poolAddress);
    console.log(`Current pool balance: ${ethers.utils.formatEther(poolBalanceBefore)} ${symbol}`);
    
    // Amount to fund (in G$)
    const amount = ethers.utils.parseEther('100'); // 100 G$
    console.log(`Amount to transfer: ${ethers.utils.formatEther(amount)} ${symbol}`);
    
    if (walletBalance.lt(amount)) {
      throw new Error(`Insufficient balance. You have ${ethers.utils.formatEther(walletBalance)} ${symbol} but trying to send ${ethers.utils.formatEther(amount)} ${symbol}`);
    }
    
    // Connect wallet to token contract
    const tokenWithSigner = tokenContract.connect(wallet);
    
    // Fund the pool using transferAndCall (ERC677 standard)
    console.log(`Sending transaction to fund pool...`);
    const tx = await tokenWithSigner.transferAndCall(poolAddress, amount, '0x');
    console.log(`Transaction sent: ${tx.hash}`);
    
    console.log('Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log(`Transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verify the funding
    const poolBalanceAfter = await tokenContract.balanceOf(poolAddress);
    console.log(`\nNew pool balance: ${ethers.utils.formatEther(poolBalanceAfter)} ${symbol}`);
    
    const expectedBalance = poolBalanceBefore.add(amount);
    if (poolBalanceAfter.eq(expectedBalance)) {
      console.log('✅ Pool funding successful!');
    } else {
      console.log('⚠️ Pool balance doesn\'t match expected amount. This could indicate an issue.');
    }
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash,
      amountFunded: ethers.utils.formatEther(amount),
      newBalance: ethers.utils.formatEther(poolBalanceAfter)
    };
  } catch (error) {
    console.error(`Error funding pool: ${error.message}`);
    if (error.reason) console.error('Reason:', error.reason);
    if (error.code) console.error('Error code:', error.code);
    throw error;
  }
}

// Run the function
fundPool()
  .then(result => {
    console.log('\nPool funding completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\nPool funding failed!');
    console.error('Final error:', error.message);
    process.exit(1);
  });