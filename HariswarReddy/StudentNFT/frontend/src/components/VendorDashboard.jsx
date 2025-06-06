import React from "react";
import UseNFT from "./UseNFT";
// Add more vendor-specific components

function VendorDashboard({ contract, account }) {
  return (
    <div>
      <h2>Vendor Dashboard</h2>
      <UseNFT contract={contract} account={account} />
      {/* Add transaction history, etc. */}
    </div>
  );
}

export default VendorDashboard;


