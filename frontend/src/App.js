import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkerProvider } from './context/WorkerContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

import WorkerSelect from './pages/worker/WorkerSelect';
import StoreSelect from './pages/worker/StoreSelect';
import SalesForm from './pages/worker/SalesForm';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

const ProtectedAdmin = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <WorkerProvider>
        <BrowserRouter>
          <Toaster position="top-center" toastOptions={{
            style: {
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', borderRadius: '10px'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }} />
          <Routes>
            <Route path="/" element={<WorkerSelect />} />
            <Route path="/store" element={<StoreSelect />} />
            <Route path="/form" element={<SalesForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkerProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
