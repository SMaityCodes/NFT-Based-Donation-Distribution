import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes';
import {useTheme, ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import {BrowserRouter as Router } from 'react-router-dom';
import WalletListener from './components/WalletListener';

// Separate component to use hooks
const AppContent = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <>
      <WalletListener />
      <Navbar 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
      />
      <AppRoutes />
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </>
  );
};

// Main App component
const App = () => {
  return (
    <Router>
      <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
    </Router>
  );
};

export default App;


