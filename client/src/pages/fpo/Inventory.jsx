import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatCard from '../../components/StatCard';
import { FiBox, FiShoppingCart, FiSettings, FiPackage, FiAlertTriangle } from 'react-icons/fi';

export default function Inventory() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inv, setInv] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState({});

  useEffect(() => {
    axios.get(`/api/inventory/${user.fpo_id}`).then(r => setInv(r.data)).catch(() => {});
    axios.get(`/api/inventory/${user.fpo_id}/alerts`).then(r => setAlerts(r.data.alerts || [])).catch(() => {});
    axios.get(`/api/inventory/${user.fpo_id}/activity`).then(r => setActivity(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📊 {t('fpo_inv_title', 'Inventory & Storage Management')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiPackage} title={t('fpo_inv_received', 'Received')} value={`${(inv.total_received || 0).toLocaleString()} kg`} color="primary" />
        <StatCard icon={FiShoppingCart} title={t('fpo_inv_sold', 'Sold')} value={`${(inv.total_sold || 0).toLocaleString()} kg`} color="blue" />
        <StatCard icon={FiSettings} title={t('fpo_inv_processing', 'Processing')} value={`${(inv.total_processing || 0).toLocaleString()} kg`} color="accent" />
        <StatCard icon={FiBox} title={t('fpo_inv_in_storage', 'In Storage')} value={`${(inv.total_stored || 0).toLocaleString()} kg`} color="purple" />
      </div>
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FiAlertTriangle className="text-yellow-500" /> {t('common_alerts', 'Alerts')}</h3>
          {alerts.map((a, i) => (
            <div key={i} className={`p-3 rounded-lg mb-2 ${a.severity === 'critical' ? 'bg-red-50 text-red-800' : a.severity === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'}`}>
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs mt-0.5 opacity-75">{a.message}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-3">{t('common_today_activity', "Today's Activity")}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-xl"><p className="text-2xl font-bold text-green-700">{activity.received || 0}</p><p className="text-xs text-green-600">{t('fpo_inv_kg_received', 'kg Received')}</p></div>
          <div className="p-4 bg-blue-50 rounded-xl"><p className="text-2xl font-bold text-blue-700">{activity.dispatched || 0}</p><p className="text-xs text-blue-600">{t('fpo_inv_kg_dispatched', 'kg Dispatched')}</p></div>
          <div className="p-4 bg-purple-50 rounded-xl"><p className="text-2xl font-bold text-purple-700">{activity.graded || 0}</p><p className="text-xs text-purple-600">{t('fpo_inv_lots_graded', 'Lots Graded')}</p></div>
        </div>
      </div>
    </div>
  );
}
