import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Analytics from './pages/Analytics';
import { AuthProvider } from './lib/auth';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
        {/* Analytics route mounted for dev; integrate into your router as needed */}
        {/* Example usage: <Analytics /> */}
      </AuthProvider>
    </BrowserRouter>
  //</React.StrictMode>
);
