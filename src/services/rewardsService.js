/**
 * Rewards service for distributing GoodDollar rewards to nonprofit wallet
 * Integrates with GoodCollective SDK for smart contract interactions
 */

const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Import GoodCollective SDK components
// const { GoodCollectiveSDK } = require('@gooddollar/goodcollective-sdk');

// Configuration
const NONPROFIT_WALLET_ADDRESS = '0x187ff8e530DEFaC66e747C2bCEBcEA81B11FfC29';
const CHAIN_ID = process.env.CHAIN_ID || '42220'; // Celo mainnet
const RPC_URL = process.env.RPC_URL || 'https://forno.celo.org';

// Mock implementation for development - replace with actual GoodCollective integration
class MockGoodCollectiveSDK {
  constructor(config) {
    this.config = config;
    logger.info('MockGoodCollectiveSDK initialized', { chainId: config.chainId });
  }

  async distributeRewards(params) {
    // Mock transaction hash for development
    const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    logger.info('Mock reward distribution:', {
      recipient: params.recipient,
      amount: params.amount,
      activityType: params.metadata?.activityType,
      txHash: mockTxHash
    });

    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      transactionHash: mockTxHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 20000000,
      gasUsed: '21000',
      status: 'confirmed'
    };
  }
}

/**
 * Initialize rewards service
 */
function initializeRewardsService() {
  try {
    // In production, use actual GoodCollective SDK
    // const sdk = new GoodCollectiveSDK({
    //   chainId: CHAIN_ID,
    //   rpcUrl: RPC_URL,
    //   privateKey: process.env.REWARDS_PRIVATE_KEY
    // });

    // For development, use mock SDK
    const sdk = new MockGoodCollectiveSDK({
      chainId: CHAIN_ID,
      rpcUrl: RPC_URL
    });

    logger.info('Rewards service initialized successfully');
    return sdk;
  } catch (error) {
    logger.error('Failed to initialize rewards service:', error);
    throw error;
  }
}

/**
 * Send GoodDollar rewards and mint NFT to nonprofit wallet
 * @param {Object} params - Reward parameters
 * @param {string} params.walletAddress - Nonprofit wallet address
 * @param {number} params.amount - Reward amount in G$ tokens
 * @param {string} params.activityType - Type of activity (volunteer/recipient)
 * @param {string} params.eventTitle - Event title for metadata
 * @param {string} params.pseudonymousId - Partial pseudonymous ID for tracking
 * @param {string} params.eventLocation - Event location for NFT metadata
 * @returns {Object} Transaction result
 */
async function sendRewardsToNonprofit(params) {
  const {
    walletAddress = NONPROFIT_WALLET_ADDRESS,
    amount,
    activityType,
    eventTitle,
    pseudonymousId,
    eventLocation = 'Community Impact Event'
  } = params;

  try {
    logger.info('Initiating reward and NFT distribution:', {
      recipient: walletAddress,
      amount,
      activityType,
      eventTitle,
      pseudonymousId
    });

    // Validate parameters
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid reward amount');
    }

    // Initialize SDK
    const sdk = initializeRewardsService();

    // Prepare reward distribution parameters
    const rewardParams = {
      recipient: walletAddress,
      amount: ethers.utils.parseUnits(amount.toString(), 18), // Convert to wei
      metadata: {
        activityType,
        eventTitle,
        pseudonymousId,
        timestamp: new Date().toISOString(),
        source: 'pseudonymous-scan'
      }
    };

    // Execute reward distribution
    const rewardResult = await sdk.distributeRewards(rewardParams);

    // Mint NFT to nonprofit wallet
    let nftResult = null;
    try {
      const { mintNFT } = require('./goodDollarService');
      
      // Map activity types to NFT-compatible types
      let nftActivityType = 'food_distribution'; // default
      switch (activityType) {
        case 'volunteer':
          nftActivityType = 'food_sorting';
          break;
        case 'recipient':
          nftActivityType = 'food_pickup';
          break;
        default:
          nftActivityType = 'food_distribution';
      }

      nftResult = await mintNFT(
        walletAddress,
        nftActivityType,
        eventLocation,
        1, // quantity
        `anon-${pseudonymousId}` // activity ID
      );

      logger.info('NFT minted successfully:', {
        nftId: nftResult.nftId,
        tokenId: nftResult.tokenId,
        txHash: nftResult.txHash,
        recipient: walletAddress
      });
    } catch (nftError) {
      logger.error('NFT minting failed:', nftError);
      // Don't fail the entire request if NFT minting fails
    }

    logger.info('Rewards and NFT distributed successfully:', {
      rewardTxHash: rewardResult.transactionHash,
      nftTxHash: nftResult?.txHash,
      recipient: walletAddress,
      amount
    });

    return {
      success: true,
      rewardTransactionHash: rewardResult.transactionHash,
      nftTransactionHash: nftResult?.txHash,
      nftId: nftResult?.nftId,
      tokenId: nftResult?.tokenId,
      blockNumber: rewardResult.blockNumber,
      gasUsed: rewardResult.gasUsed,
      amount,
      recipient: walletAddress
    };

  } catch (error) {
    logger.error('Reward distribution failed:', {
      error: error.message,
      walletAddress,
      amount,
      activityType
    });

    throw new Error(`Failed to distribute rewards: ${error.message}`);
  }
}

/**
 * Get nonprofit wallet balance
 * @param {string} walletAddress - Wallet address to check
 * @returns {Object} Balance information
 */
async function getNonprofitWalletBalance(walletAddress = NONPROFIT_WALLET_ADDRESS) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(walletAddress);
    
    return {
      address: walletAddress,
      balance: ethers.utils.formatEther(balance),
      balanceWei: balance.toString()
    };
  } catch (error) {
    logger.error('Failed to get wallet balance:', error);
    throw error;
  }
}

/**
 * Validate reward transaction
 * @param {string} txHash - Transaction hash to validate
 * @returns {Object} Transaction status
 */
async function validateRewardTransaction(txHash) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { valid: false, status: 'pending' };
    }

    return {
      valid: true,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      confirmations: receipt.confirmations
    };
  } catch (error) {
    logger.error('Transaction validation failed:', error);
    return { valid: false, status: 'error', error: error.message };
  }
}

/**
 * Get reward distribution statistics
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics  
 * @returns {Object} Reward statistics
 */
async function getRewardStatistics(startDate, endDate) {
  try {
    const PseudonymousActivity = require('../models/PseudonymousActivity');
    
    const stats = await PseudonymousActivity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          rewardsDistributed: true
        }
      },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: '$rewardAmount' },
          totalActivities: { $sum: 1 },
          uniqueParticipants: { $addToSet: '$pseudonymousId' },
          byActivityType: {
            $push: {
              type: '$activityType',
              amount: '$rewardAmount'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalRewards: 0,
      totalActivities: 0,
      uniqueParticipants: [],
      byActivityType: []
    };

    // Process activity types
    const activityBreakdown = result.byActivityType.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = { count: 0, totalAmount: 0 };
      }
      acc[item.type].count++;
      acc[item.type].totalAmount += item.amount;
      return acc;
    }, {});

    return {
      totalRewardsDistributed: result.totalRewards,
      totalActivities: result.totalActivities,
      uniqueParticipants: result.uniqueParticipants.length,
      activityBreakdown,
      nonprofitWallet: NONPROFIT_WALLET_ADDRESS,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };
  } catch (error) {
    logger.error('Failed to get reward statistics:', error);
    throw error;
  }
}

module.exports = {
  sendRewardsToNonprofit,
  getNonprofitWalletBalance,
  validateRewardTransaction,
  getRewardStatistics,
  NONPROFIT_WALLET_ADDRESS
};