import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "./abi";
import { CONTRACT_ADDRESS } from "./config";
import Campaigns from "./components/Campaigns.jsx";
import Donate from "./components/Donate.jsx";
import RegisterStudent from "./components/RegisterStudent.jsx";
import ApproveStudent from "./components/ApproveStudent.jsx";
import RegisterVendor from "./components/RegisterVendor.jsx";
import UseNFT from "./components/UseNFT.jsx";
import Home from "./components/Home.jsx";
import Header from "./components/Header.jsx";
import OwnerDashboard from "./components/OwnerDashboard.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './index.css';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    } else {
      
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const prov = new ethers.BrowserProvider(window.ethereum);
      const sign = await prov.getSigner();
      setProvider(prov);
      setSigner(sign);
      setAccount(await sign.getAddress());
      setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, sign));
    }
  };

  async function getContract() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    return contract;
  }

  return (
    <>
      {!account ? (
        <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center">
      <header className="w-full py-8 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center tracking-tight drop-shadow-lg">
          Student Fund Platform
        </h1>
      </header>
      
        <div className="flex flex-col items-center justify-center flex-1">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Empowering Education, One NFT at a Time!</h2>
          <p className="max-w-xl text-lg text-gray-700 mb-8 text-center">
            Welcome to the Student Fund Platform, where donors, students, and vendors unite to revolutionize educational funding! <br />
            <span className="font-semibold text-blue-700">Donate</span> to campaigns, <span className="font-semibold text-purple-700">register</span> as a student, or <span className="font-semibold text-green-700">join</span> as a vendor.<br />
            Every donation mints a unique NFT, ensuring transparency and direct impact. <br />
            <span className="italic text-pink-600">Be a part of the future of education funding!</span>
          </p>
          <button
            onClick={connectWallet}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform text-xl"
          >
            Connect Wallet & Get Started
          </button>
            </div>
            </div>
        </>
      ) : (
          <>
            <Router>
                <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/campaigns" element={<Campaigns contract={contract} />} />
                <Route path="/donate" element={<Donate contract={contract} />} />
                <Route path="/register-student" element={<RegisterStudent contract={contract} account={account} />} />
                <Route path="/approve-student" element={<ApproveStudent contract={contract} account={account} />} />
                <Route path="/register-vendor" element={<RegisterVendor contract={contract} account={account} />} />
                <Route path="/useNFT" element={<UseNFT contract={contract} account={account} />} />
                <Route path="/owner" element={<OwnerDashboard contract={contract} account={account} />} />
                
              </Routes>
          </Router>
          
          
          
          
          </>
          
      )}
    </>
  );
}

export default App;
