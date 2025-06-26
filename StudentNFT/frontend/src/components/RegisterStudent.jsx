import React, { useState } from "react";

function RegisterStudent({ contract }) {
  const [campaignId, setCampaignId] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [standard, setStandard] = useState("");
  const [admissionLetterHash, setAdmissionLetterHash] = useState("");

  const register = async () => {
    try {
      const tx = await contract.registerForCampaign(
        campaignId,
        schoolType,
        standard,
        admissionLetterHash
      );
      await tx.wait();
      alert("Student registered!");
    } catch (e) {
      alert("Registration failed: " + e.message);
    }
  };

  return (
    <div>
      <h2>Register as Student</h2>
      <input
        placeholder="Campaign ID"
        value={campaignId}
        onChange={e => setCampaignId(e.target.value)}
      />
      <input
        placeholder="School Type"
        value={schoolType}
        onChange={e => setSchoolType(e.target.value)}
      />
      <input
        placeholder="Standard (enum index)"
        value={standard}
        onChange={e => setStandard(e.target.value)}
      />
      <input
        placeholder="Admission Letter Hash"
        value={admissionLetterHash}
        onChange={e => setAdmissionLetterHash(e.target.value)}
      />
      <button onClick={register}>Register</button>
    </div>
  );
}

export default RegisterStudent;