import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiTruck, FiCalendar, FiMapPin, FiPackage, FiPhone, FiPlus, FiClock, FiCheckCircle } from 'react-icons/fi';
export default function TransportBooking() {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [slots, setSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    produce_type: 'Tomato',
    quantity_kg: '1000',
    pickup_village: user?.village || 'Baramati',
    preferred_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    harvest_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    contact_phone: user?.phone || '9999900010',
    notes: 'Produce packed in standard plastic crates, ready by 8 AM'
  });
  const loadSlots = () => {
    axios.get('/api/transport/my-slots').then(r => setSlots(r.data.slots || [])).catch(() => setSlots([]));
  };
  useEffect(() => {
    loadSlots();
  }, []);
  const handleBookSlot = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/transport/slots', form);
      toast.success(res.data.message || 'Transport slot reserved!');
      setShowModal(false);
      loadSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book transport slot');
    }
  };
  const u = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  return <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{t("farmer_transport_shared_transport_pro_265", "🚛 Shared Transport & Produce Collection")}</h1>
          <p className="text-sm text-gray-500">{t("farmer_transport_reserve_transport_sl_266", "Reserve transport slots. The FPO automatically aggregates village produce and dispatches the most cost-effective vehicle.")}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors">
          <FiPlus className="w-5 h-5" />{t("farmer_transport_reserve_transport_sl_267", "Reserve Transport Slot")}</button>
      </div>

      {/* Cost-Savings Informational Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🤝</span>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">{t("farmer_transport_how_shared_transport_268", "How Shared Transport Saves You Money")}</h3>
              <p className="text-xs text-emerald-800 mt-0.5 max-w-2xl">{t("farmer_transport_instead_of_renting_a_269", "Instead of renting an entire truck solo (costing ₹2,500–₹4,000), multiple farmers in your village reserve slots for the same date. The platform consolidates the loads and assigns the optimal vehicle, bringing your transport cost down to just ~₹0.85 per kg!")}</p>
            </div>
          </div>
          <div className="bg-white/80 border border-emerald-300 rounded-xl p-3 text-center min-w-[150px] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-700">{t("farmer_transport_average_savings_270", "Average Savings")}</span>
            <p className="text-2xl font-extrabold text-emerald-700">65% – 75%</p>
          </div>
        </div>
      </div>

      {/* My Reserved Transport Slots */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <FiCalendar className="text-primary-600" />{t("farmer_transport_my_transport_reserva_271", "My Transport Reservations (")}{slots.length})
        </h3>

        {slots.length > 0 ? <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_slot_code_272", "Slot Code")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_pickup_date_273", "Pickup Date")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_village_route_274", "Village Route")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_produce_quantity_275", "Produce & Quantity")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_pickup_time_window_276", "Pickup Time Window")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_assigned_fleet_277", "Assigned Fleet")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_est_share_cost_278", "Est. Share Cost")}</th>
                  <th className="py-3 px-4 text-left font-semibold">{t("farmer_transport_status_279", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-800">
                {slots.map(s => <tr key={s.id} className="hover:bg-gray-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-700">{s.slot_code}</td>
                    <td className="py-3.5 px-4 font-medium">{new Date(s.preferred_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</td>
                    <td className="py-3.5 px-4">📍 {s.pickup_village}{t("farmer_transport_fpo_centre_280", "→ FPO Centre")}</td>
                    <td className="py-3.5 px-4">
                      <strong>{s.quantity_kg?.toLocaleString()}{t("farmer_transport_kg_281", "kg")}</strong> {s.produce_type}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <span className="flex items-center gap-1 font-medium text-gray-800">
                        <FiClock className="text-primary-600 w-3 h-3" /> {s.pickup_window || '09:00 AM - 12:00 PM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.assigned_vehicle_name || <span className="text-gray-400 italic">{t("farmer_transport_auto_pairing_in_prog_282", "Auto-pairing in progress...")}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">₹{s.estimated_cost || Math.round(s.quantity_kg * 0.85)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${s.status === 'delivered' ? 'bg-green-100 text-green-800' : s.status === 'in_transit' ? 'bg-purple-100 text-purple-800' : s.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {s.status === 'assigned' ? 'Vehicle Assigned' : s.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div> : <div className="text-center py-16 border border-dashed rounded-xl p-6">
            <FiTruck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">{t("farmer_transport_no_transport_slots_r_283", "No transport slots reserved yet.")}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{t("farmer_transport_reserve_a_slot_for_y_284", "Reserve a slot for your upcoming harvest. You don't need to rent an entire truck—just enter your quantity and date!")}</p>
            <button onClick={() => setShowModal(true)} className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-primary-700">{t("farmer_transport_reserve_first_slot_285", "Reserve First Slot")}</button>
          </div>}
      </div>

      {/* Reserve Transport Slot Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t("farmer_transport_reserve_produce_tran_286", "Reserve Produce Transportation Slot")}>
        <form onSubmit={handleBookSlot} className="space-y-4">
          <div className="p-3 bg-primary-50 rounded-xl text-xs text-primary-900 font-medium leading-relaxed">
            📦 <strong>{t("farmer_transport_shared_aggregation_m_287", "Shared Aggregation Model:")}</strong>{t("farmer_transport_you_only_reserve_spa_288", "You only reserve space for your produce. The FPO groups all bookings from your village for that date and assigns the right vehicle tier.")}</div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_produce_type_289", "Produce Type")}</label>
              <select value={form.produce_type} onChange={e => u('produce_type', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-white font-medium" required>
                {['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Soybean', 'Cotton', 'Maize', 'Chilli', 'Vegetables'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_quantity_to_transpor_290", "Quantity to Transport (kg)")}</label>
              <input type="number" min="50" step="10" placeholder={t("farmer_transport_e_g_1000_291", "e.g. 1000")} value={form.quantity_kg} onChange={e => u('quantity_kg', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none font-semibold text-primary-700" required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_preferred_pickup_dat_292", "Preferred Pickup Date")}</label>
              <input type="date" value={form.preferred_date} onChange={e => u('preferred_date', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" required />
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_expected_harvest_dat_293", "Expected Harvest Date")}</label>
              <input type="date" value={form.harvest_date} onChange={e => u('harvest_date', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_pickup_village_area_294", "Pickup Village / Area")}</label>
              <input type="text" placeholder={t("farmer_transport_e_g_village_khera_ba_295", "e.g. Village Khera, Baramati")} value={form.pickup_village} onChange={e => u('pickup_village', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" required />
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_driver_contact_phone_296", "Driver Contact Phone")}</label>
              <input type="tel" placeholder={t("farmer_transport_10_digit_phone_297", "10-digit phone")} value={form.contact_phone} onChange={e => u('contact_phone', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">{t("farmer_transport_packaging_notes_opti_298", "Packaging / Notes (Optional)")}</label>
            <input type="text" placeholder={t("farmer_transport_e_g_50_plastic_crate_299", "e.g. 50 plastic crates, loading from farm gate")} value={form.notes} onChange={e => u('notes', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none" />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
            <span className="text-gray-600">{t("farmer_transport_estimated_consolidat_300", "Estimated Consolidated Rate (~₹0.85/kg):")}</span>
            <strong className="text-base text-primary-700 font-bold">
              ₹{Math.round((parseFloat(form.quantity_kg) || 0) * 0.85).toLocaleString()}
            </strong>
          </div>

          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm shadow-sm transition-colors">{t("farmer_transport_confirm_slot_reserva_301", "Confirm Slot Reservation")}</button>
        </form>
      </Modal>
    </div>;
}