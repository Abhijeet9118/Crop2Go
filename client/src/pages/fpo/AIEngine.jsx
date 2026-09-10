import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCpu, FiCheck, FiX } from 'react-icons/fi';

const icons = { aging: '⏰', rejection: '❌', buyer_reliability: '⭐', processing: '🏭', demand: '📈', wastage: '⚠️' };
const sevColors = { critical: 'border-red-300 bg-red-50', warning: 'border-yellow-300 bg-yellow-50', info: 'border-blue-300 bg-blue-50' };

export default function AIEngine() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [recs, setRecs] = useState([]);
  useEffect(() => { axios.get(`/api/ai/recommendations/${user.fpo_id}`).then(r => setRecs(r.data.recommendations || [])).catch(() => {}); }, []);

  const dismiss = (i) => { setRecs(r => r.filter((_, j) => j !== i)); toast(t('fpo_ai_dismissed', 'Alert dismissed')); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 {t('fpo_ai_title', 'AI Decision Intelligence')}</h1>
        <p className="text-primary-600 font-medium text-sm mt-1">{t('fpo_ai_subtitle', 'AI does NOT run the FPO. AI gives information. FPO decides.')}</p>
      </div>
      <div className="grid gap-4">
        {recs.map((r, i) => (
          <div key={i} className={`rounded-xl border-2 p-5 ${sevColors[r.severity] || sevColors.info}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{icons[r.type] || '💡'}</span>
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm mt-1 opacity-80">{r.message}</p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-white/50 capitalize">{r.type?.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { toast.success(t('fpo_ai_action_taken', 'Action taken!')); dismiss(i); }} className="p-2 rounded-lg bg-white hover:bg-green-100 text-green-600"><FiCheck className="w-4 h-4" /></button>
                <button onClick={() => dismiss(i)} className="p-2 rounded-lg bg-white hover:bg-red-100 text-red-600"><FiX className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {recs.length === 0 && <div className="bg-white rounded-xl border p-10 text-center text-gray-400"><FiCpu className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t('fpo_ai_no_recs', 'No recommendations at this time. AI is analyzing your data...')}</p></div>}
      </div>
    </div>
  );
}
