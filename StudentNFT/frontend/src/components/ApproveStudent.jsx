import React, { useState } from "react";

function ApproveStudent({ contract }) {
  const [studentId, setStudentId] = useState("");

  const approve = async () => {
    try {
      const tx = await contract.approveStudent(studentId);
      await tx.wait();
      alert("Student approved!");
    } catch (e) {
      alert("Approval failed: " + e.message);
    }
  };

  return (
    <div>
      <h2>Approve Student (Owner Only)</h2>
      <input
        placeholder="Student ID"
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
      />
      <button onClick={approve}>Approve</button>
    </div>
  );
}

export default ApproveStudent;