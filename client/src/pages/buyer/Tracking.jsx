import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';

export default function Tracking() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [dispatches, setDispatches] = useState([]);
  useEffect(() => { axios.get(`/api/dispatches?buyer_id=${user.id}`).then(r => setDispatches(r.data.dispatches || [])).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('buyer_tracking_title', 'Track Shipments')}</h1>
      {dispatches.length === 0 && <div className="bg-white rounded-xl border p-10 text-center text-gray-400">{t('buyer_tracking_no_shipments', 'No active shipments')}</div>}
      {dispatches.map(d => (
        <div key={d.id} className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div><p className="font-mono font-bold text-primary-600 text-lg">{d.dispatch_id}</p><p className="text-sm text-gray-500">{d.quantity_kg} kg → {d.destination}</p></div>
            <StatusBadge status={d.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-gray-500">{t('buyer_tracking_vehicle', 'Vehicle')}:</span> {d.vehicle_number}</div>
            <div><span className="text-gray-500">{t('buyer_tracking_driver', 'Driver')}:</span> {d.driver_name} ({d.driver_phone})</div>
            <div><span className="text-gray-500">{t('driver_cold_chain', 'Cold Chain')}:</span> {d.cold_chain ? `🧊 ${t('common_yes', 'Yes')} (4°C)` : `❌ ${t('common_no', 'No')}`}</div>
            <div><span className="text-gray-500">{t('buyer_tracking_expected', 'Expected')}:</span> {d.expected_arrival ? new Date(d.expected_arrival).toLocaleString() : t('common_tbd', 'TBD')}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              {[t('common_status_loading', 'Loading'), t('common_status_in_transit', 'In Transit'), t('common_status_delivered', 'Delivered')].map((step, i) => {
                const active = (d.status === 'loading' && i === 0) || (d.status === 'in_transit' && i <= 1) || (d.status === 'delivered' && i <= 2);
                return (<div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{i+1}</div>
                  <span className={`text-sm ${active ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{step}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 ${active ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                </div>);
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
