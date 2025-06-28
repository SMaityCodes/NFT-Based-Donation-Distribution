import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WalletListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        navigate('/');
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [navigate]);

  return null;
};

export default WalletListener; 