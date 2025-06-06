import React, { useState } from "react";

function UseNFT({ contract }) {
  const [nftId, setNftId] = useState("");
  const [itemProvided, setItemProvided] = useState("");

  const useNFT = async () => {
    try {
      const tx = await contract.verifyAndUseNFT(nftId, itemProvided);
      await tx.wait();
      alert("NFT used by vendor!");
    } catch (e) {
      alert("Failed: " + e.message);
    }
  };

  return (
    <div>
      <h2>Vendor: Use NFT</h2>
      <input
        placeholder="NFT ID"
        value={nftId}
        onChange={e => setNftId(e.target.value)}
      />
      <input
        placeholder="Item Provided"
        value={itemProvided}
        onChange={e => setItemProvided(e.target.value)}
      />
      <button onClick={useNFT}>Use NFT</button>
    </div>
  );
}

export default UseNFT;