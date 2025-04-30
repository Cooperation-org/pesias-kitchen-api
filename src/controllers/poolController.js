const goodDollarService = require('../services/goodDollarService');
const logger = require('../utils/logger');

const POOL_INFO_TIMEOUT = 30000; 

exports.getPoolInfo = async (req, res) => {
  const startTime = Date.now();
  logger.info('🔵 [GET /api/pool/info] Request received');

  let timeout;
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error(`Request timed out after ${POOL_INFO_TIMEOUT/1000} seconds`));
      }, POOL_INFO_TIMEOUT);
    });

    const poolInfo = await Promise.race([
      goodDollarService.getPoolInfo(),
      timeoutPromise
    ]);

    clearTimeout(timeout);
    
    logger.info(`🟢 [GET /api/pool/info] Success (${Date.now() - startTime}ms)`);
    return res.status(200).json(poolInfo);

  } catch (error) {
    if (timeout) clearTimeout(timeout);
    
    logger.error(`🔴 [GET /api/pool/info] Error: ${error.message}`, {
      error: error.stack,
      duration: `${Date.now() - startTime}ms`
    });

    return res.status(500).json({
      message: 'Failed to fetch pool info',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

exports.getUserBalance = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      logger.warn('🟠 [GET /api/pool/balance] Missing wallet address');
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    logger.info(`🔵 [GET /api/pool/balance] Fetching balance for ${walletAddress}`);
    const balance = await goodDollarService.getUserBalance(walletAddress);
    
    logger.info(`🟢 [GET /api/pool/balance] Success for ${walletAddress}`);
    return res.status(200).json(balance);
    
  } catch (error) {
    logger.error(`🔴 [GET /api/pool/balance] Error: ${error.message}`);
    return res.status(500).json({ 
      message: 'Failed to fetch user balance',
      error: error.message 
    });
  }
};