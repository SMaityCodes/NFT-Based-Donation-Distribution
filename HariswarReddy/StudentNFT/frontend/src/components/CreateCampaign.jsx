import React, { useState } from "react";

function CreateCampaign({ contract }) {
  const [name, setName] = useState("");
  const [schoolTypes, setSchoolTypes] = useState(""); // comma-separated
  const [standards, setStandards] = useState(""); // comma-separated enum indices

  const handleCreate = async () => {
    if (!name || !schoolTypes || !standards) {
      alert("Please fill all fields");
      return;
    }
    try {
      const schoolTypesArr = schoolTypes.split(",").map(s => s.trim());
      const standardsArr = standards.split(",").map(s => parseInt(s.trim(), 10));
      const tx = await contract.createCampaign(name, schoolTypesArr, standardsArr);
      await tx.wait();
      alert("Campaign created!");
      setName("");
      setSchoolTypes("");
      setStandards("");
    } catch (e) {
      alert("Error creating campaign: " + e.message);
    }
  };

  return (
    <div>
      <h3>Create Campaign</h3>
      <input
        placeholder="Campaign Name"
        value={name}
        onChange={e => setName(e.target.value)}
      /><br />
      <input
        placeholder="Allowed School Types (comma separated)"
        value={schoolTypes}
        onChange={e => setSchoolTypes(e.target.value)}
      /><br />
      <input
        placeholder="Allowed Standards (enum indices, comma separated)"
        value={standards}
        onChange={e => setStandards(e.target.value)}
      /><br />
      <button onClick={handleCreate}>Create Campaign</button>
    </div>
  );
}

export default CreateCampaign;