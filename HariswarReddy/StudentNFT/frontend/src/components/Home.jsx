import React, { useState } from 'react'
import { ethers } from "ethers";
import { CONTRACT_ABI } from "../abi";
import { CONTRACT_ADDRESS } from "../config";
import DonorDashboard from "./DonorDashboard";
import StudentDashboard from "./StudentDashboard";
import VendorDashboard from "./VendorDashboard";
import OwnerDashboard from "./OwnerDashboard";

const Home = () => {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState(""); // "owner", "vendor", "student", "donor"

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const acc = await signer.getAddress();
      setAccount(acc);
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(c);

      // Detect role
      const owner = await c.owner();
      if (acc.toLowerCase() === owner.toLowerCase()) {
        setRole("owner");
        return;
      }
      const vendor = await c.vendors(acc);
      if (vendor && vendor.approved) {
        setRole("vendor");
        return;
      }
      const isStudent = await c.isStudentRegistered(acc);
      if (isStudent) {
        setRole("student");
        return;
      }
      setRole("donor");
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center">
      <header className="w-full py-8 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center tracking-tight drop-shadow-lg">
          Student Fund Platform
        </h1>
      </header>
      {!account ? (
        <div className="fixed w-full min-h-screen bg-gradient-to-br from-black/100 to-black/70 flex flex-col items-center justify-center backdrop:blur-md ">
      <div className="flex flex-col items-center justify-center flex-1 h-1/2">
         <h1 className="text-4xl md:text-5xl mb-20 font-extrabold text-white text-center tracking-tight drop-shadow-lg">
          Student Fund Platform
        </h1>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Empowering Education, One NFT at a Time!</h2>
          <p className="max-w-xl text-lg text-white mb-8 text-center">
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
      <footer className="w-full py-4 text-center text-gray-500 text-sm" >
        &copy; {new Date().getFullYear()} Student Fund Platform. All rights reserved.
      </footer>
    </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto">
          <p className="text-center text-gray-600 mb-4">Connected: <span className="font-mono text-blue-700">{account}</span></p>
          {role === "owner" && <OwnerDashboard contract={contract} account={account} />}
          {role === "vendor" && <VendorDashboard contract={contract} account={account} />}
          {role === "student" && <StudentDashboard contract={contract} account={account} />}
          {role === "donor" && <DonorDashboard contract={contract} account={account} />}
        </div>
      )}
      <footer className="w-full py-4 mt-12 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Student Fund Platform. All rights reserved.
      </footer>
    </div>
  );
}

export default Home