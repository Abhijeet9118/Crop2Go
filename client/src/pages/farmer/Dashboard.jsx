import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { FiPackage, FiDollarSign, FiTrendingUp, FiCalendar, FiPlus, FiSearch, FiChevronRight, FiTool, FiCpu, FiAlertTriangle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
export default function FarmerDashboard() {
  const {
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([axios.get(`/api/dashboard/farmer/${user.id}`), axios.get(`/api/equipment/recommendations?farmer_id=${user.id}&fpo_id=${user.fpo_id || 1}`)]).then(([dashRes, recRes]) => {
      setData(dashRes.data);
      setRecommendations(recRes.data.recommendations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id, user.fpo_id]);
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  const d = data || {};
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("farmer_dash_welcome_147", "Welcome,")}{user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.name} 🌾
        </h1>
        <p className="text-gray-500 text-sm">{user.village ? `${user.village}, ${user.district}` : 'Standalone Farmer'}</p>
      </div>

      {!user.fpo_id && <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl p-5 text-white">
          <h3 className="font-bold text-lg">{t("farmer_dash_join_an_fpo_for_full_148", "Join an FPO for Full Benefits!")}</h3>
          <p className="text-sm opacity-90 mt-1">{t("farmer_dash_get_better_prices_ai_149", "Get better prices, AI grading, equipment booking & more")}</p>
          <Link to="/farmer/find-fpo" className="inline-flex items-center mt-3 bg-white text-accent-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-accent-50">
            <FiSearch className="w-4 h-4 mr-2" />{t("farmer_dash_find_fpos_near_you_150", "Find FPOs Near You")}</Link>
        </div>}

      {/* AI Equipment Anticipation Alert Banner */}
      {recommendations.length > 0 && <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-lg shadow-sm">
              <FiCpu />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">{t("farmer_dash_ai_upcoming_machiner_151", "AI Upcoming Machinery Alert")}</h3>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">{t("farmer_dash_action_recommended_152", "Action Recommended")}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {recommendations[0].crop_name}: <strong>{recommendations[0].equipment_type}</strong>{t("farmer_dash_required_during_153", "required during")}{recommendations[0].needed_window}.
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                <FiAlertTriangle className="w-3 h-3" />{t("farmer_dash_booking_window_154", "Booking window:")}{recommendations[0].recommended_booking_window}
              </p>
            </div>
          </div>
          <Link to="/farmer/equipment" className="self-start sm:self-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 flex-shrink-0">
            <FiTool className="w-3.5 h-3.5" />{t("farmer_dash_book_machine_now_155", "Book Machine Now")}</Link>
        </div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiPackage} title={t("farmer_dash_total_crops_156", "Total Crops")} value={d.crops_count || 0} color="primary" />
        <StatCard icon={FiDollarSign} title={t("farmer_dash_total_expenses_157", "Total Expenses")} value={`₹${(d.total_expenses || 0).toLocaleString()}`} color="accent" />
        <StatCard icon={FiCalendar} title={t("farmer_dash_active_lots_158", "Active Lots")} value={d.active_lots || 0} color="blue" />
        <StatCard icon={FiTrendingUp} title={t("farmer_dash_pending_payments_159", "Pending Payments")} value={`₹${(d.pending_payments || 0).toLocaleString()}`} color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t("farmer_dash_recent_crops_160", "Recent Crops")}</h3>
            <Link to="/farmer/crops" className="text-primary-600 text-sm hover:underline flex items-center">{t("farmer_dash_view_all_161", "View All")}<FiChevronRight className="w-4 h-4" /></Link>
          </div>
          {(d.recent_crops || []).length === 0 ? <p className="text-gray-400 text-sm">{t("farmer_dash_no_crops_logged_yet_162", "No crops logged yet")}</p> : (d.recent_crops || []).map(c => <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="font-medium text-sm">{c.crop_name}</p><p className="text-xs text-gray-500">{c.area_acres}{t("farmer_dash_acres_163", "acres")}</p></div>
                <StatusBadge status={c.status} />
              </div>)}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t("farmer_dash_quick_actions_164", "Quick Actions")}</h3>
          <div className="space-y-2">
            <Link to="/farmer/crops" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-50 transition-colors">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><FiPlus className="w-5 h-5 text-primary-600" /></div>
              <div><p className="font-medium text-sm">{t("farmer_dash_log_new_crop_165", "Log New Crop")}</p><p className="text-xs text-gray-500">{t("farmer_dash_track_your_farming_a_166", "Track your farming activity")}</p></div>
            </Link>
            <Link to="/farmer/equipment" className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><FiTool className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="font-medium text-sm">{t("farmer_dash_book_farm_machinery_167", "Book Farm Machinery")}</p><p className="text-xs text-gray-500">{t("farmer_dash_ai_forecasted_equipm_168", "AI-forecasted equipment booking")}</p></div>
            </Link>
            <Link to="/farmer/expenses" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent-50 transition-colors">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center"><FiDollarSign className="w-5 h-5 text-accent-600" /></div>
              <div><p className="font-medium text-sm">{t("farmer_dash_add_expense_169", "Add Expense")}</p><p className="text-xs text-gray-500">{t("farmer_dash_record_farming_costs_170", "Record farming costs")}</p></div>
            </Link>
            <Link to="/farmer/mandi-prices" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FiTrendingUp className="w-5 h-5 text-blue-600" /></div>
              <div><p className="font-medium text-sm">{t("farmer_dash_check_mandi_prices_171", "Check Mandi Prices")}</p><p className="text-xs text-gray-500">{t("farmer_dash_today_s_market_rates_172", "Today's market rates")}</p></div>
            </Link>
          </div>
        </div>
      </div>
    </div>;
}