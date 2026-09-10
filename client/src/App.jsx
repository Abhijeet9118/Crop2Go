import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import VoiceAssistant from './components/VoiceAssistant';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/farmer/Dashboard';
import CropLog from './pages/farmer/CropLog';
import Expenses from './pages/farmer/Expenses';
import MandiPrices from './pages/farmer/MandiPrices';
import Weather from './pages/farmer/Weather';
import FPOSearch from './pages/farmer/FPOSearch';
import MyProduce from './pages/farmer/MyProduce';
import FarmerPayments from './pages/farmer/Payments';
import EquipmentBooking from './pages/farmer/EquipmentBooking';
import TransportBooking from './pages/farmer/TransportBooking';
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
import BuyerDashboard from './pages/buyer/Dashboard';
import AvailableLots from './pages/buyer/AvailableLots';
import Orders from './pages/buyer/Orders';
import Tracking from './pages/buyer/Tracking';

import TransportPortal from './pages/driver/TransportPortal';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'buyer') return <Navigate to="/buyer" />;
  if (user.role === 'fpo_admin' || user.role === 'fpo_worker') return <Navigate to="/fpo" />;
  if (user.role === 'transporter' || user.role === 'driver') return <Navigate to="/transport" />;
  return <Navigate to="/farmer" />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <VoiceAssistant />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Driver / Transport Portal */}
        <Route path="/transport" element={<ProtectedRoute roles={['transporter', 'driver', 'fpo_admin']}><Layout /></ProtectedRoute>}>
          <Route index element={<TransportPortal />} />
        </Route>

        {/* Farmer Routes */}
        <Route path="/farmer" element={<ProtectedRoute roles={['farmer']}><Layout /></ProtectedRoute>}>
          <Route index element={<FarmerDashboard />} />
          <Route path="crops" element={<CropLog />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="mandi-prices" element={<MandiPrices />} />
          <Route path="weather" element={<Weather />} />
          <Route path="find-fpo" element={<FPOSearch />} />
          <Route path="produce" element={<MyProduce />} />
          <Route path="payments" element={<FarmerPayments />} />
          <Route path="equipment" element={<EquipmentBooking />} />
          <Route path="transport" element={<TransportBooking />} />
        </Route>

        {/* FPO Routes (Equipment completely removed) */}
        <Route path="/fpo" element={<ProtectedRoute roles={['fpo_admin','fpo_worker']}><Layout /></ProtectedRoute>}>
          <Route index element={<FPODashboard />} />
          <Route path="collection" element={<Collection />} />
          <Route path="weighing" element={<Weighing />} />
          <Route path="grading" element={<Grading />} />
          <Route path="aggregation" element={<Aggregation />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="ai-engine" element={<AIEngine />} />
          <Route path="buyers" element={<BuyerManagement />} />
          <Route path="processing" element={<Processing />} />
          <Route path="dispatch" element={<Dispatch />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="transport" element={<TransportManagement />} />
          <Route path="equipment" element={<Navigate to="/fpo" replace />} />
        </Route>

        {/* Buyer Routes */}
        <Route path="/buyer" element={<ProtectedRoute roles={['buyer']}><Layout /></ProtectedRoute>}>
          <Route index element={<BuyerDashboard />} />
          <Route path="lots" element={<AvailableLots />} />
          <Route path="orders" element={<Orders />} />
          <Route path="tracking" element={<Tracking />} />
        </Route>
      </Routes>
    </>
  );
}
