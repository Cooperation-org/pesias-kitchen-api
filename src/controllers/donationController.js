const Donation = require('../models/Donation');
const { ethers } = require('ethers');

// Initialize provider for Celo
const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || 'https://forno.celo.org'
);

/**
 * Record a new donation
 */
exports.recordDonation = async (req, res) => {
  try {
    const { txHash, amount, currency, method, donorWallet, source } = req.body;

    if (!txHash || !amount) {
      return res.status(400).json({ message: 'Transaction hash and amount are required' });
    }

    // Check if donation already exists
    const existingDonation = await Donation.findOne({ txHash });
    if (existingDonation) {
      return res.status(200).json({
        message: 'Donation already recorded',
        donation: existingDonation
      });
    }

    // Verify transaction on blockchain
    let blockNumber = null;
    let status = 'pending';

    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        blockNumber = receipt.blockNumber;
        status = receipt.status === 1 ? 'confirmed' : 'failed';
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      // Continue with pending status if blockchain verification fails
    }

    // Create donation record
    const donation = new Donation({
      txHash,
      amount: parseFloat(amount),
      currency: currency || 'cUSD',
      method: method || 'minipay',
      donorWallet: donorWallet || null,
      user: req.user?.userId || null, // Link to user if authenticated
      blockNumber,
      status,
      source: source || 'web',
      chainId: 42220 // Celo mainnet
    });

    await donation.save();

    res.status(201).json({
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({
      message: 'Failed to record donation',
      error: error.message
    });
  }
};

/**
 * Get all donations (admin only)
 */
exports.getAllDonations = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { page = 1, limit = 50, status, method } = req.query;

    const query = {};
    if (status) query.status = status;
    if (method) query.method = method;

    const donations = await Donation.find(query)
      .populate('user', 'name walletAddress')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Donation.countDocuments(query);

    res.status(200).json({
      donations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get donation by transaction hash
 */
exports.getDonationByTxHash = async (req, res) => {
  try {
    const { txHash } = req.params;

    const donation = await Donation.findOne({ txHash })
      .populate('user', 'name walletAddress');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.status(200).json(donation);
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get donation statistics
 */
exports.getDonationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Donation.getStatistics(start, end);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching donation statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update donation status (verify on blockchain)
 */
exports.verifyDonation = async (req, res) => {
  try {
    const { txHash } = req.params;

    const donation = await Donation.findOne({ txHash });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify transaction on blockchain
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.status(200).json({
        message: 'Transaction pending',
        donation
      });
    }

    // Update donation status
    donation.status = receipt.status === 1 ? 'confirmed' : 'failed';
    donation.blockNumber = receipt.blockNumber;
    await donation.save();

    res.status(200).json({
      message: 'Donation verified',
      donation
    });
  } catch (error) {
    console.error('Error verifying donation:', error);
    res.status(500).json({
      message: 'Failed to verify donation',
      error: error.message
    });
  }
};
