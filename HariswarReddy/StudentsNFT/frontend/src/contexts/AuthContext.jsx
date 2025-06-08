import React, { createContext, useContext, useState, useEffect } from 'react';
import useWeb3Store from '../store/web3Store';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { account, isConnected } = useWeb3Store();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isConnected || !account) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin
        const adminRes = await axios.get(`/api/admin/check/${account}`);
        if (adminRes.data.isAdmin) {
          setUserRole('admin');
          setLoading(false);
          return;
        }

        // Check if user is student
        const studentRes = await axios.get(`/api/students/check/${account}`);
        if (studentRes.data.isStudent) {
          setUserRole('student');
          setLoading(false);
          return;
        }

        // Check if user is vendor
        const vendorRes = await axios.get(`/api/vendors/check/${account}`);
        if (vendorRes.data.isVendor) {
          setUserRole('vendor');
          setLoading(false);
          return;
        }

        // If none of the above, user is a donor
        setUserRole('donor');
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('donor'); // Default to donor if checks fail
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [account, isConnected]);

  const value = {
    userRole,
    loading,
    account,
    isConnected
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 