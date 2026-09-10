import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatCard from '../../components/StatCard';
import { FiShoppingCart, FiPackage, FiTruck, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState({});
  useEffect(() => { axios.get(`/api/dashboard/buyer/${user.id}`).then(r => setData(r.data)).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('buyer_dash_title', 'Buyer Dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiShoppingCart} title={t('buyer_dash_total_orders', 'Total Orders')} value={data.total_orders || 0} color="primary" />
        <StatCard icon={FiPackage} title={t('buyer_dash_total_purchased', 'Purchased (kg)')} value={(data.total_purchased || 0).toLocaleString()} color="blue" />
        <StatCard icon={FiTruck} title={t('buyer_dash_pending_deliveries', 'Pending Delivery')} value={data.pending_deliveries || 0} color="accent" />
        <StatCard icon={FiDollarSign} title={t('buyer_dash_total_spent', 'Total Spent')} value={`₹${(data.total_spent || 0).toLocaleString()}`} color="purple" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/buyer/lots" className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow text-center">
          <div className="text-4xl mb-3">🛒</div><h3 className="font-semibold">{t('buyer_dash_browse_lots', 'Browse Available Lots')}</h3><p className="text-sm text-gray-500 mt-1">{t('buyer_dash_browse_lots_desc', 'View fresh produce from FPOs')}</p>
        </Link>
        <Link to="/buyer/tracking" className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow text-center">
          <div className="text-4xl mb-3">📍</div><h3 className="font-semibold">{t('buyer_dash_track_shipments', 'Track Shipments')}</h3><p className="text-sm text-gray-500 mt-1">{t('buyer_dash_track_shipments_desc', 'Monitor your deliveries in real-time')}</p>
        </Link>
      </div>
    </div>
  );
}
