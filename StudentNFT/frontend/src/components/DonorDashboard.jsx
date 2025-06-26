import React from "react";
import Campaigns from "./Campaigns";
import Donate from "./Donate";

function DonorDashboard({ contract, account }) {
  return (
    <div>
      <h2>Donor Dashboard</h2>
      <Campaigns contract={contract} />
      <Donate contract={contract} account={account} />
      {/* Add donation history, etc. */}
    </div>
  );
}

export default DonorDashboard;