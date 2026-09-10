import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

export default function PaymentManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = () => {
    axios.get(`/api/payments/fpo/${user.fpo_id}`).then(r => setPayments(r.data.payments || [])).catch(() => {});
    axios.get(`/api/orders?fpo_id=${user.fpo_id}&status=delivered`).then(r => setOrders(r.data.orders || [])).catch(() => {});
  };
  useEffect(load, []);

  const recordPayment = async (orderId) => {
    try { await axios.post('/api/payments/buyer', { order_id: orderId, fpo_id: user.fpo_id }); toast.success(t('fpo_pay_recorded', 'Payment recorded!')); load(); } catch { toast.error(t('common_failed', 'Failed')); }
  };

  const distribute = async (orderId) => {
    try { await axios.post(`/api/payments/distribute/${orderId}`); toast.success(t('fpo_pay_distributed', 'Payments distributed to farmers!')); load(); } catch { toast.error(t('common_failed', 'Failed')); }
  };

  const complete = async (id) => {
    try { await axios.put(`/api/payments/${id}/complete`); toast.success(t('fpo_pay_completed', 'Payment completed!')); load(); } catch { toast.error(t('common_failed', 'Failed')); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">💰 {t('fpo_pay_title', 'Farmer & Buyer Payments')}</h1>
      {orders.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">{t('fpo_pay_delivered_orders', 'Delivered Orders — Record Payment')}</h3>
          {orders.map(o => (
            <div key={o.id} className="flex items-center justify-between p-3 border-b last:border-0">
              <div><p className="text-sm font-medium">{o.order_id} — ₹{(o.total_amount || 0).toLocaleString()}</p><p className="text-xs text-gray-500">{o.quantity_kg}kg to {o.buyer_name || t('common_buyer', 'Buyer')}</p></div>
              <div className="flex gap-2">
                <button onClick={() => recordPayment(o.id)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">{t('fpo_pay_record_payment', 'Record Payment')}</button>
                <button onClick={() => distribute(o.id)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm">{t('fpo_pay_distribute', 'Distribute to Farmers')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50"><tr>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('common_payment_id', 'Payment ID')}</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('common_type', 'Type')}</th>
          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t('common_amount', 'Amount')}</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('common_status', 'Status')}</th>
          <th className="px-4 py-3"></th>
        </tr></thead><tbody className="divide-y">{payments.map(p => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-mono">{p.payment_id}</td>
            <td className="px-4 py-3 text-sm">{p.payment_type?.replace(/_/g, ' ')}</td>
            <td className="px-4 py-3 text-sm text-right font-semibold">₹{(p.amount || 0).toLocaleString()}</td>
            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
            <td className="px-4 py-3">{p.status === 'pending' && <button onClick={() => complete(p.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs">{t('common_complete', 'Complete')}</button>}</td>
          </tr>
        ))}</tbody></table>
        {payments.length === 0 && <p className="text-center text-gray-400 py-10">{t('fpo_pay_no_records', 'No payment records')}</p>}
      </div>
    </div>
  );
}
