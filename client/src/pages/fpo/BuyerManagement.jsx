import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { FiStar, FiPlus } from 'react-icons/fi';

export default function BuyerManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [buyers, setBuyers] = useState([]);
  const [masterLots, setMasterLots] = useState([]);
  const [showOrder, setShowOrder] = useState(false);
  const [selBuyer, setSelBuyer] = useState(null);
  const [form, setForm] = useState({ master_lot_id: '', grade: 'A', quantity_kg: '', price_per_kg: '' });

  useEffect(() => {
    axios.get('/api/buyers').then(r => setBuyers(r.data.buyers || [])).catch(() => {});
    axios.get(`/api/master-lots?fpo_id=${user.fpo_id}&status=open`).then(r => setMasterLots(r.data.masterLots || [])).catch(() => setMasterLots([]));
  }, []);

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/orders', { buyer_id: selBuyer.id, fpo_id: user.fpo_id, ...form });
      toast.success(t('fpo_buyers_order_created', 'Order created!'));
      setShowOrder(false);
    } catch (err) { toast.error(err.response?.data?.error || t('common_failed', 'Failed')); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">🛒 {t('fpo_buyers_title', 'Buyer Network & Order Generation')}</h1>
      <p className="text-sm text-gray-500">{t('fpo_buyers_subtitle', 'FPO decides. System informs.')}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buyers.map(b => (
          <div key={b.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">{b.business_name || b.name}</h3>
            <p className="text-sm text-gray-500">{b.location || b.business_type} · {b.business_type}</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('fpo_buyers_transactions', 'Transactions:')}</span><span className="font-medium">{b.past_transactions}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('fpo_buyers_avg_payment', 'Avg Payment:')}</span><span className="font-medium">{b.avg_payment_days} days</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('fpo_buyers_total_purchased', 'Total Purchased:')}</span><span className="font-medium">{(b.total_purchased_kg || 0).toLocaleString()} kg</span></div>
              <div className="flex items-center gap-1 mt-1">{[...Array(5)].map((_, i) => <FiStar key={i} className={`w-4 h-4 ${i < Math.round(b.reliability_score || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}</div>
            </div>
            <button onClick={() => { setSelBuyer(b); setShowOrder(true); }} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"><FiPlus className="w-4 h-4" /> {t('fpo_buyers_create_order', 'Create Order')}</button>
          </div>
        ))}
      </div>
      <Modal isOpen={showOrder} onClose={() => setShowOrder(false)} title={`${t('fpo_buyers_order_for', 'Order for')} ${selBuyer?.business_name || selBuyer?.name}`}>
        <form onSubmit={createOrder} className="space-y-3">
          <select value={form.master_lot_id} onChange={e => setForm(f => ({...f, master_lot_id: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required>
            <option value="">{t('fpo_buyers_select_master', 'Select Master Lot')}</option>
            {masterLots.map(m => <option key={m.id} value={m.id}>{m.master_lot_id} — {m.crop_type} ({m.total_quantity_kg}kg)</option>)}
          </select>
          <select value={form.grade} onChange={e => setForm(f => ({...f, grade: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none">
            <option value="A">{t('fpo_buyers_grade_a', 'A Grade')}</option><option value="B">{t('fpo_buyers_grade_b', 'B Grade')}</option><option value="C">{t('fpo_buyers_grade_c', 'C Grade')}</option><option value="Mixed">{t('fpo_buyers_mixed', 'Mixed')}</option>
          </select>
          <input type="number" placeholder={t('common_quantity', 'Quantity (kg)')} value={form.quantity_kg} onChange={e => setForm(f => ({...f, quantity_kg: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
          <input type="number" step="0.5" placeholder={t('common_price_per_kg', 'Price per kg (₹)')} value={form.price_per_kg} onChange={e => setForm(f => ({...f, price_per_kg: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
          {form.quantity_kg && form.price_per_kg && <p className="text-lg font-bold text-primary-700">{t('common_total', 'Total: ₹')}{(form.quantity_kg * form.price_per_kg).toLocaleString()}</p>}
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium">{t('fpo_buyers_confirm_order', 'Confirm Order')}</button>
        </form>
      </Modal>
    </div>
  );
}
