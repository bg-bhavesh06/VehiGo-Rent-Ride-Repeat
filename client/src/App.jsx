import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VehicleListing from './pages/VehicleListing';
import VehicleDetail from './pages/VehicleDetail';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

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
            
            {/* Protected Routes - Simplified for now */}
            <Route path="dashboard/user" element={<UserDashboard />} />
            <Route path="dashboard/owner" element={<OwnerDashboard />} />
            
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
