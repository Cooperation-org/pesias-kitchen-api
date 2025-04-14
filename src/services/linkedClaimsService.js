// src/services/linkedClaimsService.js
const axios = require('axios');

class LinkedClaimsService {
  constructor() {
    this.apiUrl = process.env.LINKED_CLAIMS_API_URL;
  }

  async createActivityCredential(activity, user, role) {
    try {
      const credentialData = {
        type: 'ActivityParticipation',
        subject: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress || null
        },
        activity: {
          id: activity._id.toString(),
          title: activity.title,
          date: activity.date,
          location: activity.location
        },
        role: role, // 'volunteer' or 'recipient'
        metrics: activity.metrics,
        issuanceDate: new Date().toISOString()
      };

      const response = await axios.post(`${this.apiUrl}/credentials`, credentialData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create LinkedClaims credential: ${error.message}`);
    }
  }

  async getCredential(credentialId) {
    try {
      const response = await axios.get(`${this.apiUrl}/credentials/${credentialId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get credential: ${error.message}`);
    }
  }
}

module.exports = new LinkedClaimsService();