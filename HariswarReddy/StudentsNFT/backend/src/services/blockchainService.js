const { ethers } = require('ethers');
const { CONTRACT_ADDRESS, CONTRACT_ABI } = require('../config/contract');

class BlockchainService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
  }

  async getCampaigns() {
    try {
      const campaigns = await this.contract.getAllCampaigns();
      return campaigns.map(campaign => ({
        id: campaign.id.toNumber(),
        name: campaign.name,
        description: campaign.description,
        targetAmount: ethers.utils.formatEther(campaign.targetAmount),
        raisedAmount: ethers.utils.formatEther(campaign.raisedAmount),
        active: campaign.active
      }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  async getCampaign(campaignId) {
    try {
      const campaign = await this.contract.getCampaign(campaignId);
      return {
        id: campaign.id.toNumber(),
        name: campaign.name,
        description: campaign.description,
        targetAmount: ethers.utils.formatEther(campaign.targetAmount),
        raisedAmount: ethers.utils.formatEther(campaign.raisedAmount),
        active: campaign.active
      };
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  }

  async getStudent(address) {
    try {
      const student = await this.contract.getStudent(address);
      return {
        exists: student.exists,
        schoolType: student.schoolType,
        standard: student.standard.toNumber(),
        campaignId: student.campaignId.toNumber(),
        approved: student.approved
      };
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  async getVendor(address) {
    try {
      const vendor = await this.contract.getVendor(address);
      return {
        exists: vendor.exists,
        approved: vendor.approved
      };
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService(); 