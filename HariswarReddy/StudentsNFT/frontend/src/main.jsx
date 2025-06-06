import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { lightTheme } from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline /> {/* Resets CSS to a consistent baseline */}
      <Router>
        <App />
        <Toaster position="bottom-right" reverseOrder={false} />
      </Router>
    </ThemeProvider>
  </React.StrictMode>,
);