import { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3Store } from '../store/web3Store';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const { account, contract, isConnected, isOwner } = useWeb3Store();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isConnected || !contract) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin (owner)
        if (isOwner) {
          setUserRole('admin');
          setLoading(false);
          return;
        }

        // Check if user is a student
        const student = await contract.students(account);
        if (student.studentAddress !== '0x0000000000000000000000000000000000000000') {
          setUserRole('student');
          setLoading(false);
          return;
        }

        // Check if user is a vendor
        const vendor = await contract.vendors(account);
        if (vendor.vendorAddress !== '0x0000000000000000000000000000000000000000') {
          setUserRole('vendor');
          setLoading(false);
          return;
        }

        // If none of the above, user is a donor
        setUserRole('donor');
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [account, contract, isConnected, isOwner]);

  const value = {
    userRole,
    loading,
    isAuthenticated: !!account,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth }; 