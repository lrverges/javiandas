import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AdminCompanyList from './components/Admin/AdminCompanyList';
import AdminCompanyDetail from './components/Admin/AdminCompanyDetail';
import MainLayout from './components/Layout/MainLayout';
import AddressManager from './components/AddressManager/AddressManager';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  if (!user || user.role !== 'admin_javiandas') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AdminOrCompanyAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { id } = useParams<{ id: string }>();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin_javiandas') {
    return <>{children}</>;
  }

  if (user.role === 'admin_empresa' && user.companyId === Number(id)) {
    return <>{children}</>;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas Protegidas envueltas en MainLayout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/addresses" element={<AddressManager />} />
            <Route 
              path="/admin/companies" 
              element={
                <AdminRoute>
                  <AdminCompanyList />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/companies/:id" 
              element={
                <AdminOrCompanyAdminRoute>
                  <AdminCompanyDetail />
                </AdminOrCompanyAdminRoute>
              } 
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
