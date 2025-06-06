import React from "react";
import RegisterStudent from "./RegisterStudent";
// Add more student-specific components

function StudentDashboard({ contract, account }) {
  return (
    <div>
      <h2>Student Dashboard</h2>
      <RegisterStudent contract={contract} account={account} />
      {/* Add NFT status, campaign eligibility, etc. */}
    </div>
  );
}

export default StudentDashboard;