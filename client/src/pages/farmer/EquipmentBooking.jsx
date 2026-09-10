import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiTool, FiCalendar, FiClock, FiCpu, FiAlertTriangle, FiCheckCircle, FiPlus, FiCheck, FiInfo, FiChevronRight } from 'react-icons/fi';
export default function EquipmentBooking() {
  const {
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const [equipment, setEquipment] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    booking_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '08:00',
    duration_hours: 4,
    purpose: 'Crop Harvesting / Land prep'
  });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    loadData();
  }, [user?.id, user?.fpo_id]);
  const loadData = async () => {
    setLoading(true);
    try {
      const fpoId = user?.fpo_id || 1;
      const [eqRes, recRes, bookRes] = await Promise.all([axios.get(`/api/equipment?fpo_id=${fpoId}`), axios.get(`/api/equipment/recommendations?farmer_id=${user?.id || 10}&fpo_id=${fpoId}`), axios.get(`/api/equipment/bookings?farmer_id=${user?.id || 10}`)]);
      setEquipment(eqRes.data.equipment || []);
      setRecommendations(recRes.data.recommendations || []);
      setBookings(bookRes.data.bookings || []);
    } catch (err) {
      console.error('Failed to load equipment data:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleBook = async e => {
    e.preventDefault();
    if (!selectedEq) return;
    setSubmitting(true);
    try {
      await axios.post('/api/equipment/book', {
        equipment_id: selectedEq.id,
        farmer_id: user?.id || 10,
        fpo_id: user?.fpo_id || 1,
        booking_date: bookingForm.booking_date,
        start_time: bookingForm.start_time,
        duration_hours: parseInt(bookingForm.duration_hours) || 4,
        purpose: bookingForm.purpose
      });
      toast.success(`Booking confirmed for ${selectedEq.name}!`);
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed. Time slot may already be reserved.');
    } finally {
      setSubmitting(false);
    }
  };
  const handleQuickReserve = rec => {
    // Find matching equipment in catalogue
    const matched = equipment.find(eq => eq.name.toLowerCase().includes(rec.equipment_type.toLowerCase()) || rec.equipment_type.toLowerCase().includes(eq.name.toLowerCase()) || eq.type?.toLowerCase().includes(rec.equipment_type.toLowerCase())) || equipment[0];
    if (matched) {
      setSelectedEq(matched);
      setBookingForm(f => ({
        ...f,
        purpose: `${rec.stage_name} for ${rec.crop_name}`,
        booking_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      }));
      setShowModal(true);
    } else {
      toast('Please select an available equipment below.');
    }
  };
  return <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🚜</span> {t('equipment', 'Agricultural Machinery & Equipment Booking')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t("farmer_equip_ai_driven_crop_cycle_173", "AI-driven crop cycle machinery demand forecasting, advance booking lead-time alerts, and shared FPO fleet")}</p>
      </div>

      {/* AI Equipment Recommendations Based on Active Crops */}
      {recommendations.length > 0 && <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-primary-50 rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base shadow-sm">
                <FiCpu />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{t("farmer_equip_ai_crop_cycle_machin_174", "AI Crop-Cycle Machinery Forecast")}</h2>
                <p className="text-xs text-emerald-800">{t("farmer_equip_automated_equipment__175", "Automated equipment predictions tailored to your sown crops and upcoming harvest stages")}</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-emerald-200/70 text-emerald-900 px-3 py-1 rounded-full">
              {recommendations.length}{t("farmer_equip_active_predictions_176", "Active Predictions")}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {recommendations.map((rec, idx) => <div key={idx} className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      {rec.crop_name} · {rec.stage_name}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500">{t("farmer_equip_window_177", "Window:")}{rec.needed_window}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 mb-1">{t("farmer_equip_recommended_178", "Recommended:")}{rec.equipment_type}
                  </h3>

                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {rec.alert_message}
                  </p>

                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200/60 mb-3">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <FiAlertTriangle className="w-3.5 h-3.5 text-amber-600" />{t("farmer_equip_recommended_booking__179", "Recommended Booking Window:")}</span>
                    <p className="text-xs font-semibold text-amber-800 mt-0.5">
                      {rec.recommended_booking_window}
                    </p>
                  </div>
                </div>

                <button onClick={() => handleQuickReserve(rec)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                  <FiCalendar className="w-3.5 h-3.5" />{t("farmer_equip_book_in_advance_180", "Book in Advance")}</button>
              </div>)}
          </div>
        </div>}

      {/* Equipment Fleet Catalogue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiTool className="text-primary-600" />{t("farmer_equip_available_machinery__181", "Available Machinery Fleet")}</h2>
            <p className="text-xs text-gray-500">{t("farmer_equip_verified_tractors_ha_182", "Verified tractors, harvesters, seed drills, and sprayers with real availability")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map(eq => <div key={eq.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{eq.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{eq.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${eq.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {eq.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("farmer_equip_rental_rate_183", "Rental Rate:")}</span>
                    <span className="font-bold text-primary-700 text-sm">₹{eq.rate_per_hour}{t("farmer_equip_hour_184", "/hour")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("farmer_equip_owner_operator_185", "Owner / Operator:")}</span>
                    <span className="font-semibold text-gray-800">{eq.owner_name || 'FPO Fleet Unit'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("farmer_equip_operator_type_186", "Operator Type:")}</span>
                    <span className="capitalize">{eq.owner_type || 'FPO Owned'}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => {
            setSelectedEq(eq);
            setShowModal(true);
          }} disabled={eq.status !== 'available'} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5" />{t("farmer_equip_book_machine_187", "Book Machine")}</button>
            </div>)}
        </div>
      </div>

      {/* My Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <FiCalendar className="text-primary-600" />{t("farmer_equip_my_equipment_reserva_188", "My Equipment Reservations")}</h2>

        {bookings.length === 0 ? <div className="py-8 text-center text-gray-400 text-sm">{t("farmer_equip_you_haven_t_booked_a_189", "You haven't booked any equipment yet. Reserve machinery above to prepare for your crop operations.")}</div> : <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-y">
                <tr>
                  <th className="py-3 px-4">{t("farmer_equip_equipment_190", "Equipment")}</th>
                  <th className="py-3 px-4">{t("farmer_equip_date_191", "Date")}</th>
                  <th className="py-3 px-4">{t("farmer_equip_slot_duration_192", "Slot & Duration")}</th>
                  <th className="py-3 px-4">{t("farmer_equip_work_purpose_193", "Work Purpose")}</th>
                  <th className="py-3 px-4">{t("farmer_equip_status_194", "Status")}</th>
                  <th className="py-3 px-4 text-right">{t("farmer_equip_est_cost_195", "Est. Cost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => <tr key={b.id} className="hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-bold text-gray-900">{b.equipment_name || 'Machinery'}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{b.booking_date}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                      {b.start_time} ({b.duration_hours || 4}{t("farmer_equip_hrs_196", "hrs)")}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{b.purpose || 'Agricultural work'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : b.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary-700">
                      ₹{b.total_cost || (b.rate_per_hour ? b.rate_per_hour * (b.duration_hours || 4) : 2400)}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

      {/* Booking Modal with Double-Booking Prevention */}
      {selectedEq && <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Reserve ${selectedEq.name}`}>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("farmer_equip_rate_197", "Rate:")}</span>
                <span className="font-bold text-primary-800">₹{selectedEq.rate_per_hour}{t("farmer_equip_hour_198", "/ hour")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("farmer_equip_operator_199", "Operator:")}</span>
                <span className="font-semibold text-gray-800">{selectedEq.owner_name || 'FPO Fleet'}</span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t("farmer_equip_booking_date_200", "Booking Date")}</label>
                <input type="date" value={bookingForm.booking_date} min={new Date().toISOString().split('T')[0]} onChange={e => setBookingForm(f => ({
              ...f,
              booking_date: e.target.value
            }))} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t("farmer_equip_start_time_201", "Start Time")}</label>
                <select value={bookingForm.start_time} onChange={e => setBookingForm(f => ({
              ...f,
              start_time: e.target.value
            }))} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="06:00">{t("farmer_equip_06_00_am_early_morni_202", "06:00 AM (Early Morning)")}</option>
                  <option value="08:00">{t("farmer_equip_08_00_am_morning_203", "08:00 AM (Morning)")}</option>
                  <option value="12:00">{t("farmer_equip_12_00_pm_afternoon_204", "12:00 PM (Afternoon)")}</option>
                  <option value="15:00">{t("farmer_equip_03_00_pm_late_aftern_205", "03:00 PM (Late Afternoon)")}</option>
                </select>
              </div>
            </div>

            {/* Duration & Purpose */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t("farmer_equip_duration_hours_206", "Duration (Hours)")}</label>
                <input type="number" min="1" max="12" value={bookingForm.duration_hours} onChange={e => setBookingForm(f => ({
              ...f,
              duration_hours: e.target.value
            }))} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t("farmer_equip_estimated_cost_207", "Estimated Cost")}</label>
                <div className="px-3 py-2 text-xs font-bold text-primary-700 bg-gray-50 border rounded-xl">
                  ₹{(selectedEq.rate_per_hour || 500) * (parseInt(bookingForm.duration_hours) || 1)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("farmer_equip_work_purpose_208", "Work Purpose")}</label>
              <input type="text" value={bookingForm.purpose} onChange={e => setBookingForm(f => ({
            ...f,
            purpose: e.target.value
          }))} placeholder={t("farmer_equip_e_g_wheat_harvesting_209", "e.g. Wheat Harvesting, Plot 2")} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50">{t("farmer_equip_cancel_210", "Cancel")}</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50">
                {submitting ? 'Checking Availability...' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        </Modal>}
    </div>;
}