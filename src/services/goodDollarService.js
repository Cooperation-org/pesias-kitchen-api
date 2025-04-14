// src/services/goodDollarService.js
const axios = require('axios');

class GoodDollarService {
  constructor() {
    this.apiUrl = process.env.GOODDOLLAR_API_URL;
  }

  async createWallet() {
    try {
      // This is a placeholder - you'll need to implement based on GoodDollar SDK
      const response = await axios.post(`${this.apiUrl}/wallets/create`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create GoodDollar wallet: ${error.message}`);
    }
  }

  async sendReward(walletAddress, amount, activityId) {
    try {
      // This is a placeholder - you'll need to implement based on GoodDollar SDK
      const response = await axios.post(`${this.apiUrl}/transactions`, {
        to: walletAddress,
        amount,
        reference: activityId
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send G$ reward: ${error.message}`);
    }
  }
}

module.exports = new GoodDollarService();