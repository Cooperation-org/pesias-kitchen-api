require('dotenv').config();
const { ethers } = require('ethers');

async function fundPool() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const chainId = parseInt(process.env.CHAIN_ID || '42220');
    
    const poolAddress = process.env.POOL_ADDRESS;
    if (!poolAddress) {
      throw new Error('Pool address not defined in environment');
    }
    
    const g$TokenAddress = '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A';
    
    const tokenAbi = [
      'function balanceOf(address account) external view returns (uint256)',
      'function symbol() external view returns (string)',
      'function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool)'
    ];
    
    const tokenContract = new ethers.Contract(g$TokenAddress, tokenAbi, provider);
    const symbol = await tokenContract.symbol();
    
    const walletBalance = await tokenContract.balanceOf(wallet.address);
    
    const poolBalanceBefore = await tokenContract.balanceOf(poolAddress);
    
    const amount = ethers.utils.parseEther('100');
    
    if (walletBalance.lt(amount)) {
      throw new Error(`Insufficient balance. You have ${ethers.utils.formatEther(walletBalance)} ${symbol} but trying to send ${ethers.utils.formatEther(amount)} ${symbol}`);
    }
    
    const tokenWithSigner = tokenContract.connect(wallet);
    
    const tx = await tokenWithSigner.transferAndCall(poolAddress, amount, '0x');
    
    const receipt = await tx.wait();
    
    const poolBalanceAfter = await tokenContract.balanceOf(poolAddress);
    
    return {
      success: true,
      poolAddress,
      transactionHash: receipt.transactionHash,
      amountFunded: ethers.utils.formatEther(amount),
      newBalance: ethers.utils.formatEther(poolBalanceAfter)
    };
  } catch (error) {
    throw error;
  }
}


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