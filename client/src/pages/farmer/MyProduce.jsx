import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
export default function MyProduce() {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [lots, setLots] = useState([]);
  useEffect(() => {
    axios.get(`/api/farmers/${user.id}/produce`).then(r => setLots(r.data.lots || [])).catch(() => {});
  }, []);
  return <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("farmer_produce_my_produce_247", "My Produce")}</h1>
      {!user.fpo_id && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">{t("farmer_produce_join_an_fpo_to_start_248", "Join an FPO to start tracking your produce deliveries.")}</div>}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_produce_lot_id_249", "Lot ID")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_produce_crop_250", "Crop")}</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_produce_weight_kg_251", "Weight (kg)")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_produce_grade_252", "Grade")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_produce_status_253", "Status")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_produce_date_254", "Date")}</th>
          </tr></thead>
          <tbody className="divide-y">{lots.map(l => <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono font-medium text-primary-600">{l.lot_id}</td>
              <td className="px-4 py-3 text-sm">{l.crop_type}</td>
              <td className="px-4 py-3 text-sm text-right">{l.weight_kg || l.estimated_quantity || '-'}</td>
              <td className="px-4 py-3 text-sm">{l.final_grade || '-'}</td>
              <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
            </tr>)}</tbody>
        </table>
        {lots.length === 0 && <p className="text-center text-gray-400 py-10">{t("farmer_produce_no_produce_records_f_255", "No produce records found")}</p>}
      </div>
    </div>;
}