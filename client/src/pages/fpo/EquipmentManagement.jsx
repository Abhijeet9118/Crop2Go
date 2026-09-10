import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';

export default function EquipmentManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: 'Tractor', type: 'tractor', owner_type: 'fpo_fleet', owner_name: '', rate_per_hour: '' });

  const load = () => {
    axios.get(`/api/equipment?fpo_id=${user.fpo_id}`).then(r => setEquipment(r.data.equipment || [])).catch(() => {});
    axios.get(`/api/equipment/bookings?fpo_id=${user.fpo_id}`).then(r => setBookings(r.data.bookings || [])).catch(() => {});
  };
  useEffect(load, []);

  const add = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/equipment', { fpo_id: user.fpo_id, ...form }); toast.success(t('fpo_equip_added', 'Equipment added!')); setShowModal(false); load(); } catch { toast.error(t('common_failed', 'Failed')); }
  };

  const confirm = async (id) => {
    try { await axios.put(`/api/equipment/bookings/${id}/confirm`); toast.success(t('fpo_equip_booking_confirmed', 'Booking confirmed!')); load(); } catch { toast.error(t('common_failed', 'Failed')); }
  };

  const utilized = equipment.filter(e => e.status === 'booked').length;
  const totalEq = equipment.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🔧 {t('fpo_equip_title', 'Step 11: Equipment')}</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"><FiPlus /> {t('fpo_equip_add', 'Add Equipment')}</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-primary-700">{totalEq}</p><p className="text-xs text-gray-500">{t('fpo_equip_total', 'Total Equipment')}</p></div>
        <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-blue-700">{totalEq > 0 ? Math.round((utilized/totalEq)*100) : 0}%</p><p className="text-xs text-gray-500">{t('fpo_equip_utilized', 'Utilized')}</p></div>
        <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-accent-700">{bookings.length}</p><p className="text-xs text-gray-500">{t('fpo_equip_bookings', 'Bookings')}</p></div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map(eq => (
          <div key={eq.id} className="bg-white rounded-xl border p-4">
            <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">{eq.name}</h3><StatusBadge status={eq.status} /></div>
            <p className="text-sm text-gray-500">{eq.owner_type} · {eq.owner_name || t('common_fpo', 'FPO')}</p>
            <p className="text-lg font-bold text-primary-600 mt-1">₹{eq.rate_per_hour}{t('fpo_equip_per_hr', '/hr')}</p>
          </div>
        ))}
      </div>
      {bookings.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">{t('fpo_equip_upcoming', 'Upcoming Bookings')}</h3>
          {bookings.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 border-b last:border-0">
              <div><p className="text-sm font-medium">{b.equipment_name || t('common_equipment', 'Equipment')} — {b.farmer_name || t('common_farmer', 'Farmer')}</p><p className="text-xs text-gray-500">{b.booking_date} {t('common_at', 'at')} {b.start_time}</p></div>
              <div className="flex items-center gap-2"><StatusBadge status={b.status} />{b.status === 'pending' && <button onClick={() => confirm(b.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs">{t('common_confirm', 'Confirm')}</button>}</div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('fpo_equip_add', 'Add Equipment')}>
        <form onSubmit={add} className="space-y-3">
          <select value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none">
            {['Tractor','Harvester','Rotavator','Thresher','Cultivator','Sprayer'].map(n => <option key={n}>{n}</option>)}
          </select>
          <select value={form.owner_type} onChange={e => setForm(f => ({...f, owner_type: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none">
            <option value="fpo_fleet">{t('fpo_equip_fpo_fleet', 'FPO Fleet')}</option><option value="partner">{t('fpo_equip_partner', 'Partner')}</option><option value="govt_chc">{t('fpo_equip_govt_chc', 'Govt CHC')}</option>
          </select>
          <input placeholder={t('fpo_equip_owner_name', 'Owner Name')} value={form.owner_name} onChange={e => setForm(f => ({...f, owner_name: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" />
          <input type="number" placeholder={t('fpo_equip_rate', 'Rate per hour (₹)')} value={form.rate_per_hour} onChange={e => setForm(f => ({...f, rate_per_hour: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium">{t('fpo_equip_add', 'Add Equipment')}</button>
        </form>
      </Modal>
    </div>
  );
}
