import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck } from 'react-icons/fi';

export default function Collection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [farmer, setFarmer] = useState(null);
  const [form, setForm] = useState({ crop_type: 'Tomato', variety: '', estimated_quantity: '', harvest_date: '', collection_centre: 'Centre A' });
  const [receipt, setReceipt] = useState(null);

  const searchFarmer = async () => {
    try {
      const r = await axios.get(`/api/farmers?search=${search}&fpo_id=${user.fpo_id}`);
      const farmers = r.data.farmers || [];
      if (farmers.length > 0) { setFarmer(farmers[0]); toast.success(t('fpo_collection_farmer_found', 'Farmer found!')); }
      else toast.error(t('fpo_collection_farmer_not_found', 'Farmer not found'));
    } catch { toast.error(t('common_search_failed', 'Search failed')); }
  };

  const createLot = async (e) => {
    e.preventDefault();
    try {
      const r = await axios.post('/api/lots', { farmer_id: farmer.id, fpo_id: user.fpo_id, recorded_by: user.id, ...form });
      setReceipt(r.data.lot);
      toast.success(`${t('fpo_collection_lot_created', 'Lot')} ${r.data.lot.lot_id} ${t('common_created', 'created!')}`);
    } catch (err) { toast.error(err.response?.data?.error || t('fpo_collection_create_failed', 'Failed to create lot')); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📦 {t('fpo_collection_title', 'Crop Collection & Intake')}</h1>
      
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">{t('fpo_collection_find_farmer', 'Find Farmer')}</h3>
        <div className="flex gap-2">
          <input placeholder={t('common_search_farmer_placeholder', 'Search by name or phone...')} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-3 border rounded-xl outline-none" />
          <button onClick={searchFarmer} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl"><FiSearch /></button>
        </div>
      </div>

      {farmer && !receipt && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-4 p-3 bg-primary-50 rounded-lg">
            <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 font-bold">{farmer.name?.[0]}</div>
            <div><p className="font-medium">{farmer.name}</p><p className="text-sm text-gray-500">{farmer.phone} · {farmer.village}</p></div>
          </div>
          <form onSubmit={createLot} className="space-y-3">
            <select value={form.crop_type} onChange={e => setForm(f => ({...f, crop_type: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none">
              {['Tomato','Onion','Potato','Wheat','Rice','Soybean','Maize','Cotton'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input placeholder={t('fpo_collection_variety', 'Variety (optional)')} value={form.variety} onChange={e => setForm(f => ({...f, variety: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" />
            <input type="number" placeholder={t('fpo_collection_estimated_qty', 'Estimated Quantity (kg)')} value={form.estimated_quantity} onChange={e => setForm(f => ({...f, estimated_quantity: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
            <input type="date" value={form.harvest_date} onChange={e => setForm(f => ({...f, harvest_date: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" />
            <input placeholder={t('fpo_collection_centre', 'Collection Centre')} value={form.collection_centre} onChange={e => setForm(f => ({...f, collection_centre: e.target.value}))} className="w-full px-4 py-3 border rounded-xl outline-none" />
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium">{t('fpo_collection_create_lot', 'Create Lot & Issue Receipt')}</button>
          </form>
        </div>
      )}

      {receipt && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4"><FiCheck className="w-6 h-6 text-green-600" /><h3 className="text-lg font-bold text-green-800">{t('fpo_collection_receipt_issued', 'Digital Receipt Issued')}</h3></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">{t('common_lot_id', 'Lot ID:')}</span><p className="font-mono font-bold text-lg text-primary-700">{receipt.lot_id}</p></div>
            <div><span className="text-gray-500">{t('common_farmer', 'Farmer:')}</span><p className="font-medium">{farmer.name}</p></div>
            <div><span className="text-gray-500">{t('common_crop', 'Crop:')}</span><p>{receipt.crop_type} {receipt.variety && `(${receipt.variety})`}</p></div>
            <div><span className="text-gray-500">{t('fpo_collection_estimated_qty_label', 'Estimated Qty:')}</span><p>{receipt.estimated_quantity} kg</p></div>
            <div><span className="text-gray-500">{t('fpo_collection_centre_label', 'Centre:')}</span><p>{receipt.collection_centre}</p></div>
            <div><span className="text-gray-500">{t('common_time', 'Time:')}</span><p>{new Date().toLocaleString()}</p></div>
          </div>
          <button onClick={() => { setFarmer(null); setReceipt(null); setSearch(''); }} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl text-sm">{t('fpo_collection_new', 'New Collection')}</button>
        </div>
      )}
    </div>
  );
}
