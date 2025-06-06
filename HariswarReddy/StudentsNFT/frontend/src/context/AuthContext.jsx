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
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const authenticateUser = async () => {
      if (!isConnected || !account) {
        setUserRole(null);
        setToken(null);
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      try {
        // Get or create JWT token
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: account })
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        const newToken = data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);

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
        console.error('Error authenticating user:', error);
        setUserRole(null);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, [account, contract, isConnected, isOwner]);

  const logout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem('token');
  };

  const value = {
    userRole,
    loading,
    isAuthenticated: !!token,
    token,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth }; 