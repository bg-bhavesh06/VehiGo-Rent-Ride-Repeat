import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VehicleListing from './pages/VehicleListing';
import VehicleDetail from './pages/VehicleDetail';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'Owner' ? '/dashboard/owner' : '/dashboard/user'} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="vehicles" element={<VehicleListing />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
            
            <Route
              path="dashboard/user"
              element={
                <ProtectedRoute role="User">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/owner"
              element={
                <ProtectedRoute role="Owner">
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
