const { ethers } = require('ethers');
const config = require('../config');
const CONTRACT_ABI = require('./constants.js'); // Adjust path

// Mongoose Models
const Campaign = require('../models/Campaign');
const Student = require('../models/Student');
const Donor = require('../models/Donor');
const Vendor = require('../models/Vendor');
const VendorTransaction = require('../models/VendorTransaction');

const provider = new ethers.JsonRpcProvider(config.ethereumRpcUrl);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);

const startBlockchainIndexer = async () => {
  console.log('Starting blockchain indexer...');

  // Listen for CampaignCreated event
  contract.on('CampaignCreated', async (campaignId, name, event) => {
    console.log(`Event: CampaignCreated - ID: ${campaignId}, Name: ${name}`);
    // You might need to fetch full campaign details if allowedSchoolTypes and allowedStandards aren't in the event
    // For now, rely on `contract.campaigns(campaignId)` after the event.
    try {
      const campaignData = await contract.campaigns(campaignId);
      await Campaign.findOneAndUpdate(
        { campaignId: campaignId.toNumber() },
        {
          campaignId: campaignId.toNumber(),
          name: campaignData.name,
          allowedSchoolTypes: campaignData.allowedSchoolTypes,
          allowedStandards: campaignData.allowedStandards.map(s => s.toNumber()),
          exists: campaignData.exists,
        },
        { upsert: true, new: true } // Create if not exists, return new doc
      );
      console.log(`Indexed Campaign: ${name}`);
    } catch (err) {
      console.error('Error indexing CampaignCreated:', err);
    }
  });

  // Listen for CampaignDonationReceived event
  contract.on('CampaignDonationReceived', async (campaignId, donorAddress, amount, event) => {
    console.log(`Event: DonationReceived - Campaign: ${campaignId}, Donor: ${donorAddress}, Amount: ${ethers.formatEther(amount)} ETH`);
    try {
      const amountEth = ethers.formatEther(amount);
      const donorDoc = await Donor.findOne({ donorAddress: donorAddress.toLowerCase() });

      if (donorDoc) {
        // Update existing donor
        const campaignContributionIndex = donorDoc.campaignContributions.findIndex(
          (c) => c.campaignId === campaignId.toNumber()
        );

        if (campaignContributionIndex !== -1) {
          // Add to existing campaign contribution
          const currentAmount = ethers.parseEther(donorDoc.campaignContributions[campaignContributionIndex].amount);
          donorDoc.campaignContributions[campaignContributionIndex].amount = ethers.formatEther(currentAmount + amount);
        } else {
          // Add new campaign contribution
          donorDoc.campaignContributions.push({ campaignId: campaignId.toNumber(), amount: amountEth });
        }
        const currentTotal = ethers.parseEther(donorDoc.totalDonated);
        donorDoc.totalDonated = ethers.formatEther(currentTotal + amount);
        donorDoc.lastDonationAt = new Date(event.block.timestamp * 1000);
        await donorDoc.save();
      } else {
        // Create new donor
        await Donor.create({
          donorAddress: donorAddress.toLowerCase(),
          totalDonated: amountEth,
          campaignContributions: [{ campaignId: campaignId.toNumber(), amount: amountEth }],
          firstDonationAt: new Date(event.block.timestamp * 1000),
          lastDonationAt: new Date(event.block.timestamp * 1000),
        });
      }
      console.log(`Indexed Donation for ${donorAddress}`);
    } catch (err) {
      console.error('Error indexing CampaignDonationReceived:', err);
    }
  });

  // Listen for StudentRegistered event
  contract.on('StudentRegistered', async (studentId, studentAddress, campaignId, event) => {
    console.log(`Event: StudentRegistered - ID: ${studentId}, Address: ${studentAddress}, Campaign: ${campaignId}`);
    try {
      const studentData = await contract.students(studentId); // Fetch full student details
      await Student.findOneAndUpdate(
        { studentId: studentId.toNumber() },
        {
          studentId: studentId.toNumber(),
          studentAddress: studentAddress.toLowerCase(),
          schoolType: studentData.schoolType,
          standard: studentData.standard.toNumber(),
          admissionLetterHash: ethers.toUtf8String(studentData.admissionLetterHash), // Convert bytes32 to string
          approved: studentData.approved,
          nftId: studentData.nftId.toNumber(),
          campaignId: campaignId.toNumber(),
          registeredAt: new Date(event.block.timestamp * 1000),
        },
        { upsert: true, new: true }
      );
      console.log(`Indexed Student Registration for ${studentAddress}`);
    } catch (err) {
      console.error('Error indexing StudentRegistered:', err);
    }
  });

  // Listen for StudentApproved event
  contract.on('StudentApproved', async (studentId, nftId, event) => {
    console.log(`Event: StudentApproved - Student ID: ${studentId}, NFT ID: ${nftId}`);
    try {
      const studentData = await contract.students(studentId); // Fetch updated student details
      await Student.findOneAndUpdate(
        { studentId: studentId.toNumber() },
        {
          approved: true,
          nftId: nftId.toNumber(),
          approvedAt: new Date(event.block.timestamp * 1000),
        }
      );
      // You might also want to index NFT details if they are separate from Student struct
      console.log(`Indexed Student Approval for ${studentId}`);
    } catch (err) {
      console.error('Error indexing StudentApproved:', err);
    }
  });

  // Listen for VendorRegistered event
  contract.on('VendorRegistered', async (vendorAddress, event) => {
    console.log(`Event: VendorRegistered - Address: ${vendorAddress}`);
    try {
      await Vendor.findOneAndUpdate(
        { vendorAddress: vendorAddress.toLowerCase() },
        {
          vendorAddress: vendorAddress.toLowerCase(),
          approved: true,
          registeredAt: new Date(event.block.timestamp * 1000),
        },
        { upsert: true, new: true }
      );
      console.log(`Indexed Vendor Registration for ${vendorAddress}`);
    } catch (err) {
      console.error('Error indexing VendorRegistered:', err);
    }
  });

  // Listen for NFTUsed event
  contract.on('NFTUsed', async (nftId, vendorAddress, event) => {
    console.log(`Event: NFTUsed - NFT ID: ${nftId}, Vendor: ${vendorAddress}`);
    try {
      // Fetch details needed for VendorTransaction
      const nftDetails = await contract.getNFTDetails(nftId);
      const ownerAddress = nftDetails.currentOwner; // This would be the student's address before transfer

      // Note: `itemProvided` is part of `verifyAndUseNFT` call, not emitted in the event.
      // If you need `itemProvided` in the backend, you'd need to either:
      // 1. Add it to the NFTUsed event in your contract.
      // 2. Query the transaction receipt for the input data (more complex).
      // For now, we'll mark it as "Unknown" if not available in event.
      let itemProvided = "Unknown Item"; // Placeholder, improve if event has it

      await VendorTransaction.findOneAndUpdate(
        { nftId: nftId.toNumber() },
        {
          nftId: nftId.toNumber(),
          studentAddress: ownerAddress.toLowerCase(),
          vendorAddress: vendorAddress.toLowerCase(),
          itemProvided: itemProvided,
          timestamp: new Date(event.block.timestamp * 1000),
        },
        { upsert: true, new: true }
      );
      console.log(`Indexed NFT Used transaction for NFT ${nftId}`);
    } catch (err) {
      console.error('Error indexing NFTUsed:', err);
    }
  });

  // Optionally, fetch past events on startup to ensure sync
  console.log('Fetching past events (this might take a while for large histories)...');
  const filterCampaignCreated = contract.filters.CampaignCreated();
  const filterStudentRegistered = contract.filters.StudentRegistered();
  const filterStudentApproved = contract.filters.StudentApproved();
  const filterVendorRegistered = contract.filters.VendorRegistered();
  const filterNFTUsed = contract.filters.NFTUsed();
  const filterCampaignDonationReceived = contract.filters.CampaignDonationReceived();

  // You might want to get events from a specific block number
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = 0; // Or a specific block from which to start indexing

  const pastCampaignCreatedEvents = await contract.queryFilter(filterCampaignCreated, fromBlock, latestBlock);
  const pastStudentRegisteredEvents = await contract.queryFilter(filterStudentRegistered, fromBlock, latestBlock);
  const pastStudentApprovedEvents = await contract.queryFilter(filterStudentApproved, fromBlock, latestBlock);
  const pastVendorRegisteredEvents = await contract.queryFilter(filterVendorRegistered, fromBlock, latestBlock);
  const pastNFTUsedEvents = await contract.queryFilter(filterNFTUsed, fromBlock, latestBlock);
  const pastCampaignDonationReceivedEvents = await contract.queryFilter(filterCampaignDonationReceived, fromBlock, latestBlock);


  console.log('Processing past events...');
  // Process past events in a chronological order if possible, or handle duplicates via upsert
  for (const event of pastCampaignCreatedEvents) {
      await contract.emit('CampaignCreated', event.args[0], event.args[1], event); // Re-trigger listener logic
  }
  for (const event of pastStudentRegisteredEvents) {
      await contract.emit('StudentRegistered', event.args[0], event.args[1], event.args[2], event);
  }
  for (const event of pastStudentApprovedEvents) {
      await contract.emit('StudentApproved', event.args[0], event.args[1], event);
  }
  for (const event of pastVendorRegisteredEvents) {
      await contract.emit('VendorRegistered', event.args[0], event);
  }
  for (const event of pastNFTUsedEvents) {
      // Be careful here: NFTUsed event in contract does not emit itemProvided.
      // You might need to adjust event args or add itemProvided to the event.
      // For now, `event.args[0]` is nftId, `event.args[1]` is vendorAddress.
      await contract.emit('NFTUsed', event.args[0], event.args[1], event);
  }
  for (const event of pastCampaignDonationReceivedEvents) {
      await contract.emit('CampaignDonationReceived', event.args[0], event.args[1], event.args[2], event);
  }


  console.log('Blockchain indexer started and past events processed.');
};

module.exports = startBlockchainIndexer;