import React, { useState } from "react";
import { ethers } from "ethers";

function Donate({ contract }) {
  const [campaignId, setCampaignId] = useState("");
  const [amount, setAmount] = useState("");

  const donate = async () => {
    if (!campaignId || !amount) return;
    try {
      const tx = await contract.donateToCampaign(campaignId, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      alert("Donation successful!");
    } catch (e) {
      alert("Donation failed: " + e.message);
    }
  };

  return (
    <div>
      <h2>Donate to Campaign</h2>
      <input
        placeholder="Campaign ID"
        value={campaignId}
        onChange={e => setCampaignId(e.target.value)}
      />
      <input
        placeholder="Amount (ETH)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button onClick={donate}>Donate</button>
    </div>
  );
}

export default Donate;