import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/StatusBadge';
import { FiSearch } from 'react-icons/fi';

export default function Weighing() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [weight, setWeight] = useState('');

  useEffect(() => { axios.get(`/api/lots?fpo_id=${user.fpo_id}&status=collected`).then(r => setLots(r.data.lots || [])).catch(() => {}); }, []);

  const submitWeight = async () => {
    try {
      await axios.post(`/api/lots/${selected.id}/weigh`, { weight_kg: parseFloat(weight), weighed_by: user.id });
      toast.success(`${weight} kg ${t('fpo_weighing_recorded_for', 'recorded for')} ${selected.lot_id}`);
      setSelected(null); setWeight('');
      axios.get(`/api/lots?fpo_id=${user.fpo_id}&status=collected`).then(r => setLots(r.data.lots || []));
    } catch (err) { toast.error(t('fpo_weighing_fail', 'Failed to record weight')); }
  };

  const filtered = lots.filter(l => !search || l.lot_id?.toLowerCase().includes(search.toLowerCase()) || l.crop_type?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">⚖️ {t('fpo_weighing_title', 'Weighing Station')}</h1>
      {selected ? (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div><p className="font-mono text-lg font-bold text-primary-600">{selected.lot_id}</p><p className="text-sm text-gray-500">{selected.crop_type} · {t('common_farmer_label', 'Farmer:')} {selected.farmer_name || t('common_na', 'N/A')}</p></div>
            <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gray-700">← {t('common_back', 'Back')}</button>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">{t('fpo_weighing_weight_label', 'Weight (kg)')}</label>
              <input type="number" step="0.1" placeholder={t('fpo_weighing_enter_weight', 'Enter weight...')} value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-4 py-4 border-2 border-primary-300 rounded-xl outline-none text-2xl font-bold text-center focus:border-primary-500" autoFocus />
            </div>
            <button onClick={submitWeight} disabled={!weight} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-medium disabled:opacity-50">{t('fpo_weighing_record', 'Record')}</button>
          </div>
        </div>
      ) : (
        <>
          <input placeholder={t('common_search_lot_crop', 'Search by Lot ID or crop...')} value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none" />
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full"><thead className="bg-gray-50"><tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('common_lot_id_header', 'Lot ID')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('common_crop_header', 'Crop')}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t('common_est_qty_header', 'Est. Qty')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t('common_status_header', 'Status')}</th>
              <th className="px-4 py-3"></th>
            </tr></thead><tbody className="divide-y">{filtered.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">{l.lot_id}</td>
                <td className="px-4 py-3 text-sm">{l.crop_type}</td>
                <td className="px-4 py-3 text-sm text-right">{l.estimated_quantity} kg</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3"><button onClick={() => setSelected(l)} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm hover:bg-primary-200">{t('fpo_weighing_weigh_button', 'Weigh')}</button></td>
              </tr>
            ))}</tbody></table>
            {filtered.length === 0 && <p className="text-center text-gray-400 py-10">{t('fpo_weighing_no_lots', 'No lots pending weighing')}</p>}
          </div>
        </>
      )}
    </div>
  );
}
