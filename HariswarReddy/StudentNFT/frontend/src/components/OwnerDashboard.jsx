import React from "react";
import Campaigns from "./Campaigns";
import ApproveStudent from "./ApproveStudent";
import RegisterVendor from "./RegisterVendor";
import CreateCampaign from "./CreateCampaign.jsx";

function OwnerDashboard({ contract, account }) {
  return (
    <div>
      <h2>Owner Dashboard</h2>
      <CreateCampaign contract={contract} />
      <Campaigns contract={contract} />
      <ApproveStudent contract={contract} account={account} />
      <RegisterVendor contract={contract} account={account} />
    </div>
  );
}

export default OwnerDashboard;