import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import { FiDollarSign } from 'react-icons/fi';
export default function Payments() {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    axios.get(`/api/payments/farmer/${user.id}`).then(r => setPayments(r.data.payments || [])).catch(() => {});
  }, []);
  const total = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  return <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("farmer_payments_my_payments_256", "My Payments")}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm text-green-700">{t("farmer_payments_total_received_257", "Total Received")}</p>
          <p className="text-2xl font-bold text-green-800">₹{total.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <p className="text-sm text-yellow-700">{t("farmer_payments_pending_258", "Pending")}</p>
          <p className="text-2xl font-bold text-yellow-800">₹{pending.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_payments_payment_id_259", "Payment ID")}</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_payments_amount_260", "Amount")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_payments_grade_breakdown_261", "Grade Breakdown")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_payments_status_262", "Status")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_payments_date_263", "Date")}</th>
          </tr></thead>
          <tbody className="divide-y">{payments.map(p => <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono">{p.payment_id}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold">₹{p.amount?.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{p.grade_breakdown || '-'}</td>
              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              <td className="px-4 py-3 text-sm text-gray-500">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}</td>
            </tr>)}</tbody>
        </table>
        {payments.length === 0 && <p className="text-center text-gray-400 py-10">{t("farmer_payments_no_payment_records_264", "No payment records")}</p>}
      </div>
    </div>;
}