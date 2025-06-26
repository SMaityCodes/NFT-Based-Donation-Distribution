import React, { useEffect, useState } from "react";

function Campaigns({ contract }) {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (contract) {
      contract.getAllCampaigns().then(setCampaigns);
    }
  }, [contract]);

  return (
    <div>
      <h2>All Campaigns</h2>
      <ul>
        {campaigns.map((c, idx) => (
          <li key={idx}>
            <b>{c.name}</b> (ID: {c.id})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Campaigns;