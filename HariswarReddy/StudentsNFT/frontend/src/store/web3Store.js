import { create } from 'zustand';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

const useWeb3Store = create((set, get) => ({
  account: null,
  contract: null,
  isConnected: false,
  isOwner: false,
  isAdmin: false,
  isStudent: false,
  isVendor: false,
  loading: false,
  error: null,

  connectWallet: async () => {
    try {
      set({ loading: true, error: null });
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Check if the connected account is the owner
      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === accounts[0].toLowerCase();

      // Check roles
      const isAdmin = isOwner; // Owner is also admin
      const isStudent = await contract.isStudentRegistered(accounts[0]);
      
      // Check if address is a vendor by looking for VendorRegistered event
      const filter = contract.filters.VendorRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      const isVendor = events.some(event => 
        event.args.vendorAddress.toLowerCase() === accounts[0].toLowerCase()
      );

      set({
        account: accounts[0],
        contract,
        isConnected: true,
        isOwner,
        isAdmin,
        isStudent,
        isVendor,
        loading: false,
      });

      toast.success('Wallet connected successfully!');

      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length > 0) {
          get().connectWallet(); // Reconnect to update states
        } else {
          get().disconnectWallet();
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId) => {
        console.log("Network changed to:", chainId);
        get().connectWallet(); // Reconnect to update states
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      set({ error: error.message, loading: false });
      toast.error(error.message);
    }
  },

  disconnectWallet: () => {
    set({
      account: null,
      contract: null,
      isConnected: false,
      isOwner: false,
      isAdmin: false,
      isStudent: false,
      isVendor: false,
      error: null,
    });
    toast.info('Wallet disconnected');
  },

  refreshWeb3: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;

    try {
      set({ loading: true, error: null });
      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === account.toLowerCase();
      const isAdmin = isOwner;
      const isStudent = await contract.isStudentRegistered(account);
      
      // Check if address is a vendor by looking for VendorRegistered event
      const filter = contract.filters.VendorRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      const isVendor = events.some(event => 
        event.args.vendorAddress.toLowerCase() === account.toLowerCase()
      );
      
      set({ isOwner, isAdmin, isStudent, isVendor, loading: false });
    } catch (error) {
      console.error('Error refreshing web3 state:', error);
      set({ error: error.message, loading: false });
    }
  },

  // For view functions without needing a connected wallet
  getReadOnlyContract: () => {
    const { provider, contract } = get();
    if (contract) return contract; // If connected, use the existing contract instance

    if (typeof window !== 'undefined' && window.ethereum) {
        // Use window.ethereum for read-only if available but not connected
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newProvider);
    } else {
        // Fallback to a generic RPC provider for read-only
        const rpcProvider = new ethers.JsonRpcProvider(import.meta.env.VITE_SEPOLIA_RPC_URL);
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rpcProvider);
    }
  },
}));

// Export both named and default for backward compatibility
export { useWeb3Store };
export default useWeb3Store;