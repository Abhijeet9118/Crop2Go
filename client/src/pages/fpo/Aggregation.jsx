import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/StatusBadge';

export default function Aggregation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [lots, setLots] = useState([]);
  const [masterLots, setMasterLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [groupBy, setGroupBy] = useState('Tomato');

  const load = () => {
    axios.get(`/api/lots?fpo_id=${user.fpo_id}&status=graded`).then(r => setLots(r.data.lots || [])).catch(() => {});
    axios.get(`/api/master-lots?fpo_id=${user.fpo_id}`).then(r => setMasterLots(r.data.masterLots || [])).catch(() => {});
  };
  useEffect(load, []);

  const crops = [...new Set(lots.map(l => l.crop_type))];
  const filtered = lots.filter(l => l.crop_type === groupBy);
  const toggle = (id) => setSelectedLots(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selData = filtered.filter(l => selectedLots.includes(l.id));
  const totalKg = selData.reduce((s, l) => s + (l.weight_kg || 0), 0);

  const createMasterLot = async () => {
    try {
      await axios.post('/api/master-lots', { lot_ids: selectedLots, fpo_id: user.fpo_id, crop_type: groupBy });
      toast.success(t('fpo_agg_created_success', 'Master Lot created!'));
      setSelectedLots([]);
      load();
    } catch (err) { toast.error(err.response?.data?.error || t('common_failed', 'Failed')); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">🟢 {t('fpo_agg_title', 'Master Lot Aggregation')}</h1>
      <p className="text-sm text-gray-500">{t('fpo_agg_subtitle', 'Combine individual lots into Master Lots for bulk selling')}</p>
      <div className="flex gap-2 flex-wrap">
        {crops.map(c => <button key={c} onClick={() => { setGroupBy(c); setSelectedLots([]); }} className={`px-4 py-2 rounded-xl text-sm font-medium ${groupBy === c ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600'}`}>{c}</button>)}
      </div>
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('fpo_agg_graded_lots', 'Graded')} {groupBy} {t('fpo_agg_lots', 'Lots')} ({filtered.length})</h3>
            <button onClick={() => setSelectedLots(filtered.map(l => l.id))} className="text-sm text-primary-600 hover:underline">{t('fpo_agg_select_all', 'Select All')}</button>
          </div>
          {filtered.map(l => (
            <label key={l.id} className={`flex items-center gap-3 p-3 rounded-lg mb-1 cursor-pointer ${selectedLots.includes(l.id) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selectedLots.includes(l.id)} onChange={() => toggle(l.id)} className="w-4 h-4 text-primary-600" />
              <div className="flex-1"><p className="text-sm font-mono font-medium">{l.lot_id}</p><p className="text-xs text-gray-500">{l.weight_kg} kg · A:{l.grade_a_kg} B:{l.grade_b_kg} C:{l.grade_c_kg}</p></div>
            </label>
          ))}
          {selectedLots.length > 0 && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm font-medium">{t('fpo_agg_selected', 'Selected:')} {selectedLots.length} {t('fpo_agg_lots', 'lots')} · {t('common_total', 'Total:')} {totalKg} kg</p>
              <button onClick={createMasterLot} className="mt-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl text-sm font-medium">{t('fpo_agg_create_master', 'Create Master Lot')}</button>
            </div>
          )}
        </div>
      )}
      {masterLots.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">{t('fpo_agg_existing', 'Existing Master Lots')}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {masterLots.map(m => (
              <div key={m.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-center justify-between mb-2"><p className="font-mono font-bold text-primary-600">{m.master_lot_id}</p><StatusBadge status={m.status} /></div>
                <p className="text-sm">{m.crop_type} · {m.total_quantity_kg} kg · {m.contributing_farmers} {t('common_farmers', 'farmers')}</p>
                <div className="mt-2 h-3 rounded-full overflow-hidden flex bg-gray-100">
                  {m.total_quantity_kg > 0 && <><div className="bg-green-500" style={{width:`${(m.grade_a_kg/m.total_quantity_kg)*100}%`}} /><div className="bg-blue-500" style={{width:`${(m.grade_b_kg/m.total_quantity_kg)*100}%`}} /><div className="bg-yellow-500" style={{width:`${(m.grade_c_kg/m.total_quantity_kg)*100}%`}} /></>}
                </div>
                <p className="text-xs text-gray-400 mt-1">A:{m.grade_a_kg}kg B:{m.grade_b_kg}kg C:{m.grade_c_kg}kg</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
