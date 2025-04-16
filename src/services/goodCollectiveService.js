const axios = require('axios');
const logger = require('../utils/logger');

class GoodCollectiveService {
  constructor() {
    this.apiUrl = process.env.GOODCOLLECTIVE_API_URL || 'http://localhost:5001/api';
  }

  async createPool(activityName, rewardSettings) {
    try {
      // This is a placeholder - adapt based on the actual GoodCollective API
      const response = await axios.post(`${this.apiUrl}/pools`, {
        name: `Pesia's Kitchen: ${activityName}`,
        rewards: rewardSettings,
        description: `Food rescue activity: ${activityName}`,
        createdAt: new Date()
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to create GoodCollective pool: ${error.message}`);
      // Return a default response to avoid breaking the application
      return {
        poolId: 'pending',
        status: 'pending'
      };
    }
  }

  async recordAction(activityId, walletAddress, role) {
    try {
      // This is a placeholder - adapt based on the actual GoodCollective API
      const response = await axios.post(`${this.apiUrl}/actions`, {
        activityId,
        walletAddress,
        role,
        timestamp: new Date()
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to record action in GoodCollective: ${error.message}`);
      // Return a default response to avoid breaking the application
      return {
        actionId: 'pending',
        status: 'pending'
      };
    }
  }

  async distributeRewards(activityId, participants) {
    try {
      // This is a placeholder - adapt based on the actual GoodCollective API
      const response = await axios.post(`${this.apiUrl}/rewards/distribute`, {
        activityId,
        participants
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to distribute rewards in GoodCollective: ${error.message}`);
      // Return a default response to avoid breaking the application
      return {
        status: 'pending',
        rewards: []
      };
    }
  }

  async trackImpact(activityId, metrics) {
    try {
      // This is a placeholder - adapt based on the actual GoodCollective API
      const response = await axios.post(`${this.apiUrl}/impact`, {
        activityId,
        metrics
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to track impact in GoodCollective: ${error.message}`);
      // Return a default response to avoid breaking the application
      return {
        status: 'pending'
      };
    }
  }
}

module.exports = new GoodCollectiveService();