import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';

export default function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  useEffect(() => { axios.get(`/api/orders?buyer_id=${user.id}`).then(r => setOrders(r.data.orders || [])).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('buyer_orders_title', 'My Orders')}</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50"><tr>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('buyer_orders_id', 'Order ID')}</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('buyer_orders_crop', 'Crop')}</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('buyer_orders_grade', 'Grade')}</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t('buyer_orders_quantity', 'Qty (kg)')}</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t('buyer_orders_total_price', 'Total (₹)')}</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('buyer_orders_status', 'Status')}</th>
        </tr></thead><tbody className="divide-y">{orders.map(o => (
          <tr key={o.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-mono font-medium text-primary-600">{o.order_id}</td>
            <td className="px-4 py-3 text-sm">{o.crop_type || '-'}</td>
            <td className="px-4 py-3 text-sm">{o.grade}</td>
            <td className="px-4 py-3 text-sm text-right">{o.quantity_kg?.toLocaleString()}</td>
            <td className="px-4 py-3 text-sm text-right font-semibold">₹{(o.total_amount || 0).toLocaleString()}</td>
            <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
          </tr>
        ))}</tbody></table>
        {orders.length === 0 && <p className="text-center text-gray-400 py-10">{t('buyer_orders_no_orders', 'No orders yet. Browse available lots to place your first order.')}</p>}
      </div>
    </div>
  );
}
