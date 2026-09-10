import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  FiTruck, FiPlus, FiCalendar, FiMapPin, FiUsers, FiCheck,
  FiFileText, FiTrendingUp, FiActivity, FiLayers, FiDollarSign
} from 'react-icons/fi';

export default function TransportManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('aggregation'); // 'aggregation' | 'fleet'
  const [clusters, setClusters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Assign Vehicle Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [assignForm, setAssignForm] = useState({
    vehicle_id: '',
    pickup_window: '08:30 AM - 11:30 AM'
  });

  // Add Vehicle Modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    vehicle_type: 'standard_truck',
    capacity_kg: '5000',
    operator_name: 'FPO Fleet',
    driver_name: '',
    driver_phone: '',
    rate: '3500'
  });

  // Logistics Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  const loadData = () => {
    setLoading(true);
    axios.get('/api/transport/aggregated')
      .then(r => {
        setClusters(r.data.clusters || []);
        setVehicles(r.data.available_vehicles || []);
      })
      .catch(() => setClusters([]))
      .finally(() => setLoading(false));

    axios.get('/api/transport/vehicles')
      .then(r => setVehicles(r.data.vehicles || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Approve & Assign Vehicle
  const handleAssignVehicle = async (e) => {
    e.preventDefault();
    if (!selectedCluster) return;

    try {
      await axios.post('/api/transport/schedules/assign', {
        date: selectedCluster.date,
        village: selectedCluster.village,
        vehicle_id: assignForm.vehicle_id,
        pickup_window: assignForm.pickup_window
      });
      toast.success(t('fpo_trans_assign_success', 'Logistics schedule approved and vehicle dispatched!'));
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      toast.error(t('fpo_trans_assign_fail', 'Failed to assign vehicle'));
    }
  };

  // Add Vehicle to Fleet
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transport/vehicles', newVehicle);
      toast.success(t('fpo_trans_add_success', 'New vehicle added to fleet!'));
      setShowAddVehicleModal(false);
      loadData();
    } catch {
      toast.error(t('fpo_trans_add_fail', 'Failed to add vehicle'));
    }
  };

  // Open Logistics Report
  const handleOpenReport = async (date) => {
    try {
      const res = await axios.get(`/api/transport/report?date=${date}`);
      setReportData(res.data);
      setShowReportModal(true);
    } catch {
      toast.error(t('fpo_trans_report_fail', 'Failed to generate report'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🚛 {t('fpo_trans_title', 'AI Transport Demand Aggregation & Logistics')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('fpo_trans_subtitle', 'Automatically group smallholder farmer bookings into full truckloads and optimize vehicle fleet dispatch')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <FiPlus /> {t('fpo_trans_add_vehicle', 'Add Vehicle')}
          </button>
          <button
            onClick={() => handleOpenReport(new Date().toISOString().split('T')[0])}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <FiFileText /> {t('fpo_trans_daily_plan', 'Daily Logistics Plan')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('aggregation')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'aggregation' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {t('fpo_trans_tab_clusters', 'Aggregated Village Demand Clusters')} ({clusters.length})
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'fleet' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {t('fpo_trans_tab_fleet', 'Active Fleet Registry')} ({vehicles.length})
        </button>
      </div>

      {/* ========================================================== */}
      {/* AGGREGATED VILLAGE DEMAND CLUSTERS */}
      {/* ========================================================== */}
      {activeTab === 'aggregation' && (
        <div className="space-y-4">
          {clusters.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 hover:border-primary-300 transition-all">
              {/* Cluster Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary-100 text-primary-800 font-bold px-2.5 py-0.5 rounded-full">
                      📍 {t('common_village', 'Village:')} {c.village}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5" /> {t('common_target_date', 'Target Date:')} {new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    {c.total_quantity_kg.toLocaleString()} kg {t('fpo_trans_agg_produce', 'Aggregated Produce')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {t('fpo_trans_consolidated_from', 'Consolidated from')} <strong>{c.farmer_count} {t('common_farmers', 'farmers')}</strong> {t('fpo_trans_across', 'across')} {Object.keys(c.produce_breakdown).map(k => `${k} (${c.produce_breakdown[k]}kg)`).join(', ')}
                  </p>
                </div>

                {/* AI Smart Vehicle Recommendation Card */}
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl min-w-[280px]">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                    <span>🤖 {t('fpo_trans_ai_rec', 'AI Recommendation')}</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                      {c.recommendation.utilization_pct}% {t('common_capacity', 'Capacity')}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-purple-950">
                    {c.recommendation.tier_name}
                  </p>
                  <p className="text-[11px] text-purple-700">
                    {t('fpo_trans_model', 'Model:')} {c.recommendation.typical_model} ({t('fpo_trans_rated', 'Rated')} {c.recommendation.capacity_kg} kg)
                  </p>
                  {/* Utilization Bar */}
                  <div className="h-2 w-full bg-purple-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${c.recommendation.utilization_pct}%` }} />
                  </div>
                </div>
              </div>

              {/* Contributing Farmers & Slots Breakdown */}
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {t('fpo_trans_slots_on_route', 'Contributing Farmer Slots on this Route:')}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {c.slots.map(s => (
                    <div key={s.id} className="p-2.5 bg-gray-50 rounded-xl border text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{s.farmer_name || t('common_farmer', 'Farmer')} ({s.quantity_kg}kg)</p>
                        <p className="text-[10px] text-gray-500">{s.produce_type} · {s.contact_phone}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${s.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Economic Analysis & Dispatch Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                <div className="text-xs text-gray-600">
                  <span>{t('fpo_trans_fleet_cost', 'Consolidated Fleet Cost:')} <strong>₹{c.cost_analysis.shared_total_cost}</strong></span>
                  <span className="mx-2">·</span>
                  <span className="text-emerald-700 font-bold">{t('fpo_trans_farmer_savings', 'Farmer Shared Savings:')} ₹{c.cost_analysis.total_savings} ({c.cost_analysis.savings_pct}%)</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCluster(c);
                      setShowAssignModal(true);
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    {t('fpo_trans_approve_assign', 'Approve Schedule & Assign Vehicle')}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {clusters.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed p-8">
              <FiTruck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">{t('fpo_trans_no_clusters', 'No pending transport demand clusters.')}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('fpo_trans_no_clusters_sub', 'When farmers reserve produce transportation slots, they automatically group here by date and village.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* FLEET REGISTRY TAB */}
      {/* ========================================================== */}
      {activeTab === 'fleet' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-500">{v.vehicle_number}</span>
                  <h3 className="text-lg font-bold text-gray-900">{v.vehicle_type?.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-gray-500">{v.operator_name} · {t('common_driver', 'Driver:')} {v.driver_name}</p>
                </div>
                <StatusBadge status={v.status} />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs text-gray-700">
                <p>{t('fpo_trans_rated_capacity', 'Rated Capacity:')} <strong>{v.capacity_kg} kg</strong></p>
                <p>{t('fpo_trans_cold_chain', 'Cold Chain:')} <strong>{v.has_cold_chain ? `🧊 ${t('fpo_trans_refrigerated', 'Refrigerated')}` : `📦 ${t('fpo_trans_ambient', 'Ambient Standard')}`}</strong></p>
                <p>{t('fpo_trans_base_rate', 'Base Trip Rate:')} <strong>₹{v.rate}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN VEHICLE MODAL */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={t('fpo_trans_approve_assign', 'Approve Schedule & Assign Vehicle')}>
        {selectedCluster && (
          <form onSubmit={handleAssignVehicle} className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900 font-medium">
              {t('fpo_trans_assigning', 'Assigning vehicle for')} <strong>{selectedCluster.total_quantity_kg} kg produce</strong> {t('common_in', 'in')} <strong>{selectedCluster.village}</strong> {t('common_on', 'on')} <strong>{selectedCluster.date}</strong>.
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">{t('fpo_trans_select_vehicle', 'Select Vehicle from Fleet (or keep AI Recommended Tier)')}</label>
              <select
                value={assignForm.vehicle_id}
                onChange={e => setAssignForm(f => ({ ...f, vehicle_id: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-xl text-xs outline-none bg-white font-medium"
                required
              >
                <option value="">-- {t('fpo_trans_ai_rec', 'AI Recommendation:')} {selectedCluster.recommendation.tier_name} --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_type?.replace(/_/g, ' ')} — {v.vehicle_number} ({v.capacity_kg}kg {t('common_capacity', 'capacity')}, {t('common_driver', 'Driver:')} {v.driver_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">{t('fpo_trans_pickup_window', 'Farmer Pickup Time Window')}</label>
              <input
                type="text"
                value={assignForm.pickup_window}
                onChange={e => setAssignForm(f => ({ ...f, pickup_window: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm shadow-sm"
            >
              {t('fpo_trans_confirm_dispatch', 'Confirm Dispatch Schedule')}
            </button>
          </form>
        )}
      </Modal>

      {/* ADD VEHICLE MODAL */}
      <Modal isOpen={showAddVehicleModal} onClose={() => setShowAddVehicleModal(false)} title={t('fpo_trans_add_vehicle_title', 'Add Vehicle to Transport Fleet')}>
        <form onSubmit={handleAddVehicle} className="space-y-3">
          <input
            type="text"
            placeholder={t('fpo_trans_vehicle_number_ph', 'Vehicle Number (e.g. MH-12-AB-1234)')}
            value={newVehicle.vehicle_number}
            onChange={e => setNewVehicle(v => ({ ...v, vehicle_number: e.target.value }))}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            required
          />
          <select
            value={newVehicle.vehicle_type}
            onChange={e => setNewVehicle(v => ({ ...v, vehicle_type: e.target.value }))}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white"
          >
            <option value="small_pickup">{t('fpo_trans_opt_pickup', 'Small Pickup / Magic (100–300 kg)')}</option>
            <option value="mini_truck">{t('fpo_trans_opt_mini', 'Mini Truck (300–1,500 kg)')}</option>
            <option value="standard_truck">{t('fpo_trans_opt_standard', 'Standard 6-Wheeler Truck (1,500–5,000 kg)')}</option>
            <option value="heavy_truck">{t('fpo_trans_opt_heavy', 'Heavy Commercial Truck (5,000+ kg)')}</option>
            <option value="cold_truck">{t('fpo_trans_opt_cold', 'Refrigerated Cold Storage Truck')}</option>
          </select>
          <input
            type="number"
            placeholder={t('fpo_trans_payload_ph', 'Payload Capacity (kg)')}
            value={newVehicle.capacity_kg}
            onChange={e => setNewVehicle(v => ({ ...v, capacity_kg: e.target.value }))}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            required
          />
          <input
            type="text"
            placeholder={t('fpo_trans_driver_name_ph', 'Driver Name')}
            value={newVehicle.driver_name}
            onChange={e => setNewVehicle(v => ({ ...v, driver_name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            required
          />
          <input
            type="tel"
            placeholder={t('fpo_trans_driver_phone_ph', 'Driver Phone')}
            value={newVehicle.driver_phone}
            onChange={e => setNewVehicle(v => ({ ...v, driver_phone: e.target.value }))}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            required
          />
          <input
            type="number"
            placeholder={t('fpo_trans_trip_rate_ph', 'Trip Rate (₹)')}
            value={newVehicle.rate}
            onChange={e => setNewVehicle(v => ({ ...v, rate: e.target.value }))}
            className="w-full px-3 py-2 border rounded-xl text-xs outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs"
          >
            {t('fpo_trans_register_vehicle', 'Register Vehicle')}
          </button>
        </form>
      </Modal>

      {/* DAILY LOGISTICS REPORT MODAL */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={t('fpo_trans_daily_report_title', 'Daily FPO Logistics Operations Plan')} size="lg">
        {reportData && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-gray-500">{t('fpo_trans_dispatch_plan_date', 'Dispatch Plan For Date')}</p>
                <h3 className="text-xl font-bold text-gray-900">{reportData.target_date}</h3>
              </div>
              <div className="text-right">
                <p className="text-gray-500">{t('fpo_trans_total_produce_collect', 'Total Produce to Collect')}</p>
                <p className="text-2xl font-black text-primary-800">{reportData.total_tonnage_kg.toLocaleString()} kg</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm">{t('fpo_trans_village_routes', 'Village Pickup Routes')}</h4>
              {reportData.clusters?.map((cl, idx) => (
                <div key={idx} className="p-3 bg-white border rounded-xl space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>{t('fpo_trans_route', 'Route')} #{idx + 1}: {cl.village} {t('fpo_trans_cluster', 'Cluster')}</span>
                    <span className="text-purple-700">{cl.recommendation.tier_name} ({cl.total_quantity_kg} kg)</span>
                  </div>
                  <p className="text-gray-500">{t('fpo_trans_farmers_to_visit', 'Farmers to visit:')} {cl.slots?.map(s => `${s.farmer_name} (${s.quantity_kg}kg)`).join(' &rarr; ')}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-medium"
            >
              {t('fpo_trans_close_plan', 'Close Plan')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
