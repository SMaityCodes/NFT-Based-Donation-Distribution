import React, { useState } from "react";

function RegisterVendor({ contract }) {
  const [vendorAddress, setVendorAddress] = useState("");

  const register = async () => {
    try {
      const tx = await contract.registerVendor(vendorAddress);
      await tx.wait();
      alert("Vendor registered!");
    } catch (e) {
      alert("Registration failed: " + e.message);
    }
  };

  return (
    <div>
      <h2>Register Vendor (Owner Only)</h2>
      <input
        placeholder="Vendor Address"
        value={vendorAddress}
        onChange={e => setVendorAddress(e.target.value)}
      />
      <button onClick={register}>Register</button>
    </div>
  );
}

export default RegisterVendor;