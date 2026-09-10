import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
export default function MandiPrices() {
  const {
    t
  } = useLanguage();
  const [prices, setPrices] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const crops = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Soybean'];
  useEffect(() => {
    axios.get('/api/market/prices').then(r => setPrices(r.data.prices || [])).catch(() => {});
  }, []);
  const filtered = prices.filter(p => p.crop === selectedCrop);
  return <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("farmer_mandi_mandi_prices_240", "Mandi Prices")}</h1>
      <div className="flex gap-2 flex-wrap">
        {crops.map(c => <button key={c} onClick={() => setSelectedCrop(c)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedCrop === c ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{c}</button>)}
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_mandi_market_241", "Market")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_mandi_state_242", "State")}</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_mandi_min_kg_243", "Min (₹/kg)")}</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_mandi_max_kg_244", "Max (₹/kg)")}</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_mandi_modal_kg_245", "Modal (₹/kg)")}</th>
          </tr></thead>
          <tbody className="divide-y">{filtered.map((p, i) => <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium">{p.market}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{p.state}</td>
              <td className="px-4 py-3 text-sm text-right text-red-600">₹{p.min_price}</td>
              <td className="px-4 py-3 text-sm text-right text-green-600">₹{p.max_price}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold">₹{p.modal_price}</td>
            </tr>)}</tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-10">{t("farmer_mandi_no_price_data_availa_246", "No price data available")}</p>}
      </div>
    </div>;
}