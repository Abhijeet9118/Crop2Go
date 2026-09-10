import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AvailableLots() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [lots, setLots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ grade: 'A', quantity_kg: '', price_per_kg: '' });

  useEffect(() => { axios.get('/api/master-lots?status=open').then(r => setLots(r.data.masterLots || [])).catch(() => {}); }, []);

  const placeOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/orders', { buyer_id: user.id, master_lot_id: selected.id, fpo_id: selected.fpo_id, ...form });
      toast.success(t('buyer_lots_order_success', 'Order placed!'));
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.error || t('common_error', 'Failed')); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('buyer_lots_title', 'Available Lots')}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lots.map(m => (
          <div key={m.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <p className="font-mono font-bold text-primary-600">{m.master_lot_id}</p>
            <p className="text-lg font-semibold mt-1">{m.crop_type}</p>
            <p className="text-sm text-gray-500">{m.total_quantity_kg?.toLocaleString()} {t('buyer_lots_kg_available', 'kg available')}</p>
            <div className="mt-3 h-3 rounded-full overflow-hidden flex bg-gray-100">
              {m.total_quantity_kg > 0 && (<><div className="bg-green-500" style={{width:`${(m.grade_a_kg/m.total_quantity_kg)*100}%`}}/><div className="bg-blue-500" style={{width:`${(m.grade_b_kg/m.total_quantity_kg)*100}%`}}/><div className="bg-yellow-500" style={{width:`${(m.grade_c_kg/m.total_quantity_kg)*100}%`}}/></>)}
            </div>
            <p className="text-xs text-gray-400 mt-1">A:{m.grade_a_kg}kg · B:{m.grade_b_kg}kg · C:{m.grade_c_kg}kg</p>
            <p className="text-xs text-gray-400">{m.contributing_farmers} {t('buyer_lots_farmers', 'farmers')}</p>
            <button onClick={() => { setSelected(m); setShowModal(true); }} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium">{t('buyer_lots_place_order', 'Place Order')}</button>
          </div>
        ))}
        {lots.length === 0 && <p className="text-gray-400 col-span-3 text-center py-10">{t('buyer_lots_no_lots', 'No lots available right now')}</p>}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${t('buyer_lots_order', 'Order')}: ${selected?.master_lot_id}`}>
        <form onSubmit={placeOrder} className="space-y-3">
          <div className="p-3 bg-primary-50 rounded-lg text-sm"><strong>{selected?.crop_type}</strong> — {selected?.total_quantity_kg} {t('buyer_lots_kg_available', 'kg available')}</div>
          <select value={form.grade} onChange={e => setForm(f => ({...f, grade: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none">
            <option value="A">{t('buyer_lots_grade_a', 'A Grade')}</option><option value="B">{t('buyer_lots_grade_b', 'B Grade')}</option><option value="C">{t('buyer_lots_grade_c', 'C Grade')}</option><option value="Mixed">{t('buyer_lots_grade_mixed', 'Mixed')}</option>
          </select>
          <input type="number" placeholder={t('buyer_lots_quantity', 'Quantity (kg)')} value={form.quantity_kg} onChange={e => setForm(f => ({...f, quantity_kg: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
          <input type="number" step="0.5" placeholder={t('buyer_lots_offer_price', 'Your offer price per kg (₹)')} value={form.price_per_kg} onChange={e => setForm(f => ({...f, price_per_kg: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
          {form.quantity_kg && form.price_per_kg && <p className="text-lg font-bold text-primary-700">{t('common_total', 'Total')}: ₹{(form.quantity_kg * form.price_per_kg).toLocaleString()}</p>}
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium">{t('buyer_lots_confirm_order', 'Confirm Order')}</button>
        </form>
      </Modal>
    </div>
  );
}
