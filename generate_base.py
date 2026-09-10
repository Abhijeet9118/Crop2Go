import os

BASE_DIR = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src"

files = {
    "context/AuthContext.jsx": """import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to fetch user', err);
        setToken(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (phone, password) => {
    try {
      const res = await axios.post('/api/auth/login', { phone, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (data) => {
    try {
      const res = await axios.post('/api/auth/register', data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
""",
    "App.jsx": """import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

// Farmer Pages
import FarmerDashboard from './pages/farmer/Dashboard';
import CropLog from './pages/farmer/CropLog';
import Expenses from './pages/farmer/Expenses';
import MandiPrices from './pages/farmer/MandiPrices';
import Weather from './pages/farmer/Weather';
import FPOSearch from './pages/farmer/FPOSearch';
import MyProduce from './pages/farmer/MyProduce';
import Payments from './pages/farmer/Payments';
import EquipmentBooking from './pages/farmer/EquipmentBooking';
import TransportBooking from './pages/farmer/TransportBooking';

// FPO Pages
import FPODashboard from './pages/fpo/Dashboard';
import Collection from './pages/fpo/Collection';
import Weighing from './pages/fpo/Weighing';
import Grading from './pages/fpo/Grading';
import Aggregation from './pages/fpo/Aggregation';
import Inventory from './pages/fpo/Inventory';
import AIEngine from './pages/fpo/AIEngine';
import BuyerManagement from './pages/fpo/BuyerManagement';
import Processing from './pages/fpo/Processing';
import Dispatch from './pages/fpo/Dispatch';
import PaymentManagement from './pages/fpo/PaymentManagement';
import EquipmentManagement from './pages/fpo/EquipmentManagement';
import TransportManagement from './pages/fpo/TransportManagement';

// Buyer Pages
import BuyerDashboard from './pages/buyer/Dashboard';
import AvailableLots from './pages/buyer/AvailableLots';
import Orders from './pages/buyer/Orders';
import Tracking from './pages/buyer/Tracking';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
  if (['fpo_admin', 'fpo_worker'].includes(user.role)) return <Navigate to="/fpo/dashboard" replace />;
  if (user.role === 'buyer') return <Navigate to="/buyer/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Farmer Routes */}
        <Route path="/farmer/*" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<FarmerDashboard />} />
                <Route path="crops" element={<CropLog />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="mandi" element={<MandiPrices />} />
                <Route path="weather" element={<Weather />} />
                <Route path="fpos" element={<FPOSearch />} />
                <Route path="produce" element={<MyProduce />} />
                <Route path="payments" element={<Payments />} />
                <Route path="equipment" element={<EquipmentBooking />} />
                <Route path="transport" element={<TransportBooking />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* FPO Routes */}
        <Route path="/fpo/*" element={
          <ProtectedRoute allowedRoles={['fpo_admin', 'fpo_worker']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<FPODashboard />} />
                <Route path="collection" element={<Collection />} />
                <Route path="weighing" element={<Weighing />} />
                <Route path="grading" element={<Grading />} />
                <Route path="aggregation" element={<Aggregation />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="ai-insights" element={<AIEngine />} />
                <Route path="buyers" element={<BuyerManagement />} />
                <Route path="processing" element={<Processing />} />
                <Route path="dispatch" element={<Dispatch />} />
                <Route path="payments" element={<PaymentManagement />} />
                <Route path="equipment" element={<EquipmentManagement />} />
                <Route path="transport" element={<TransportManagement />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Buyer Routes */}
        <Route path="/buyer/*" element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<BuyerDashboard />} />
                <Route path="lots" element={<AvailableLots />} />
                <Route path="orders" element={<Orders />} />
                <Route path="tracking" element={<Tracking />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
""",
}

for filepath, content in files.items():
    full_path = os.path.join(BASE_DIR, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("App and AuthContext generated successfully.")
