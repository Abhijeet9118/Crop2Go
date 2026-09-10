import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { FiUsers, FiPackage, FiBox, FiDollarSign, FiShoppingCart, FiTruck, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function FPODashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState({});
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    axios.get(`/api/dashboard/fpo/${user.fpo_id}`).then(r => setData(r.data)).catch(() => {});
    axios.get(`/api/ai/recommendations/${user.fpo_id}`).then(r => setAlerts(r.data.recommendations || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('fpo_dash_title', 'FPO Dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={FiUsers} title={t('fpo_dash_total_farmers', 'Farmers')} value={data.total_farmers || 0} color="primary" />
        <StatCard icon={FiPackage} title={t('fpo_dash_active_lots', 'Active Lots')} value={data.active_lots || 0} color="blue" />
        <StatCard icon={FiBox} title={t('fpo_dash_stored', 'Stored (kg)')} value={(data.stored_kg || 0).toLocaleString()} color="purple" />
        <StatCard icon={FiDollarSign} title={t('fpo_dash_revenue', 'Revenue')} value={`₹${(data.revenue || 0).toLocaleString()}`} color="accent" />
        <StatCard icon={FiShoppingCart} title={t('fpo_dash_pending_orders', 'Pending Orders')} value={data.pending_orders || 0} color="yellow" />
        <StatCard icon={FiTruck} title={t('fpo_dash_active_dispatches', 'Active Dispatches')} value={data.active_dispatches || 0} color="blue" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('fpo_dash_today_activity', "Today's Activity")}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('fpo_dash_produce_received', 'Produce Received')}</span><span className="font-medium">{data.today_received || 0} kg</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('fpo_dash_lots_graded', 'Lots Graded')}</span><span className="font-medium">{data.today_graded || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('fpo_dash_dispatched', 'Dispatched')}</span><span className="font-medium">{data.today_dispatched || 0} kg</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FiAlertTriangle className="text-yellow-500" /> {t('fpo_dash_ai_alerts', 'AI Alerts')}</h3>
            <Link to="/fpo/ai-engine" className="text-primary-600 text-sm hover:underline flex items-center">{t('common_view_all', 'View All')} <FiChevronRight className="w-4 h-4" /></Link>
          </div>
          {alerts.slice(0, 4).map((a, i) => (
            <div key={i} className={`p-3 rounded-lg mb-2 ${a.severity === 'critical' ? 'bg-red-50 border-red-200' : a.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} border`}>
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-gray-400 text-sm">{t('common_no_alerts', 'No alerts')}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">{t('common_quick_actions', 'Quick Actions')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ to: '/fpo/collection', label: t('fpo_dash_new_collection', 'New Collection'), icon: '📦', color: 'bg-primary-50' },
            { to: '/fpo/inventory', label: t('fpo_dash_view_inventory', 'View Inventory'), icon: '📊', color: 'bg-blue-50' },
            { to: '/fpo/ai-engine', label: t('fpo_dash_ai_insights', 'AI Insights'), icon: '🤖', color: 'bg-purple-50' },
            { to: '/fpo/dispatch', label: t('fpo_dash_dispatch', 'Dispatch'), icon: '🚚', color: 'bg-accent-50' }
          ].map(a => (
            <Link key={a.to} to={a.to} className={`${a.color} rounded-xl p-4 text-center hover:shadow-md transition-shadow`}>
              <div className="text-3xl mb-2">{a.icon}</div>
              <p className="text-sm font-medium">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
