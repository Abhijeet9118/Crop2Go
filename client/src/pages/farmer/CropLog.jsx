import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { FiPlus, FiCheck, FiClock, FiCalendar, FiMapPin, FiTrendingUp, FiAlertTriangle, FiCloudRain, FiCheckSquare, FiSquare, FiCamera, FiChevronLeft, FiAward, FiInfo, FiActivity, FiFileText, FiRefreshCw } from 'react-icons/fi';
import { getStates, getDistricts, getVillages } from '../../data/indiaLocations';
export default function MyCrops() {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [crops, setCrops] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'harvested'
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [cropDetail, setCropDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Add Crop Form State
  const initialForm = {
    // Step 1: Field / Land
    field_name: 'Main Field A',
    total_area_acres: '2.5',
    cultivated_area_acres: '2.5',
    location_state: user?.state || 'Maharashtra',
    location_district: user?.district || 'Pune',
    location_village: user?.village || 'Baramati',
    soil_type: 'Loamy Soil',
    irrigation_type: 'Drip Irrigation',
    water_availability: 'Adequate',
    previous_crop_field: 'Mustard',
    // Step 2: Crop Details
    crop_name: 'Wheat',
    custom_crop_name: '',
    variety: 'HD-2967 (Hybrid)',
    sowing_date: new Date().toISOString().split('T')[0],
    seed_quantity: '40',
    expected_yield: '36',
    yield_unit: 'quintal',
    farming_method: 'Conventional',
    seed_source: 'Certified Seed Agency',
    // Step 3: Farming Conditions
    irrigation_method: 'Drip System',
    fertilizer_info: 'DAP 50kg basal + 20kg Urea',
    notes: 'Well ploughed field with pre-sowing irrigation'
  };
  const [form, setForm] = useState(initialForm);

  // Daily Tracker update state inside Detail view
  const [trackerTasks, setTrackerTasks] = useState([]);
  const [trackerHealth, setTrackerHealth] = useState('Good');
  const [trackerIrrigation, setTrackerIrrigation] = useState('Not Required');
  const [trackerPest, setTrackerPest] = useState('None');
  const [trackerDisease, setTrackerDisease] = useState('None');
  const [trackerNotes, setTrackerNotes] = useState('');

  // Harvest form
  const [harvestForm, setHarvestForm] = useState({
    actual_harvest_date: new Date().toISOString().split('T')[0],
    actual_yield: '',
    yield_unit: 'quintal',
    quality_grade: 'Grade A',
    notes: 'Harvested under dry sunny conditions, good grain filling'
  });

  // Location dropdowns for wizard (Pan-India coverage)
  const states = useMemo(() => getStates(), []);
  const districts = useMemo(() => getDistricts(form.location_state), [form.location_state]);
  const villages = useMemo(() => getVillages(form.location_state, form.location_district), [form.location_state, form.location_district]);

  // Load all crops
  const loadCrops = () => {
    axios.get('/api/crops').then(r => setCrops(r.data.crops || [])).catch(() => setCrops([]));
  };
  useEffect(() => {
    loadCrops();
  }, []);

  // Load individual crop details
  const openCropDetail = id => {
    setSelectedCropId(id);
    setLoadingDetail(true);
    axios.get(`/api/crops/${id}`).then(r => {
      setCropDetail(r.data);
      if (r.data.today) {
        setTrackerTasks(r.data.today.tasks || []);
        setTrackerHealth(r.data.today.health_status || 'Good');
        setTrackerIrrigation(r.data.today.irrigation_status || 'Not Required');
        setTrackerPest(r.data.today.pest_observation || 'None');
        setTrackerDisease(r.data.today.disease_observation || 'None');
        setTrackerNotes(r.data.today.notes || '');
      }
    }).catch(() => toast.error('Failed to load crop details')).finally(() => setLoadingDetail(false));
  };

  // Submit new crop
  const handleAddCrop = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/crops', form);
      toast.success(res.data.message || 'Crop registered successfully!');
      setShowAddModal(false);
      setAddStep(1);
      setForm(initialForm);
      loadCrops();
      if (res.data.id) {
        openCropDetail(res.data.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  // Save Daily Log
  const handleSaveDailyLog = async () => {
    if (!selectedCropId) return;
    try {
      const res = await axios.post(`/api/crops/${selectedCropId}/daily-log`, {
        day_number: cropDetail?.crop?.current_day,
        tasks: trackerTasks,
        health_status: trackerHealth,
        irrigation_status: trackerIrrigation,
        pest_observation: trackerPest,
        disease_observation: trackerDisease,
        notes: trackerNotes
      });
      toast.success('Daily crop diary updated!');
      if (res.data.prediction_updated) {
        toast('AI adjusted harvest prediction based on recent observations!', {
          icon: '🤖'
        });
      }
      openCropDetail(selectedCropId);
    } catch {
      toast.error('Failed to save log');
    }
  };

  // AI Photo Observation Trigger
  const handleRunAIPhoto = async () => {
    if (!selectedCropId) return;
    try {
      toast.loading('Analyzing crop image with AI...', {
        id: 'ai-img'
      });
      const res = await axios.post(`/api/crops/${selectedCropId}/ai-photo`, {});
      toast.dismiss('ai-img');
      toast.success('AI Screening completed!');
      openCropDetail(selectedCropId);
    } catch {
      toast.dismiss('ai-img');
      toast.error('AI screening failed');
    }
  };

  // Harvest submission
  const handleHarvestSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(`/api/crops/${selectedCropId}/harvest`, harvestForm);
      toast.success('Crop marked as harvested!');
      setShowHarvestModal(false);
      loadCrops();
      openCropReport(selectedCropId);
    } catch {
      toast.error('Failed to mark crop as harvested');
    }
  };

  // Open Final Report
  const openCropReport = async cropId => {
    try {
      const res = await axios.get(`/api/crops/${cropId}/report`);
      setReportData(res.data);
      setShowReportModal(true);
    } catch {
      toast.error('Failed to generate final report');
    }
  };

  // Form helper
  const u = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const activeCrops = crops.filter(c => c.status === 'active');
  const pastCrops = crops.filter(c => c.status === 'harvested');
  return <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      {!selectedCropId ? <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{t("farmer_crops_my_crop_lifecycle_tr_1", "🌾 My Crop Lifecycle Tracker")}</h1>
              <p className="text-sm text-gray-500">{t("farmer_crops_end_to_end_digital_c_2", "End-to-end digital crop diary & intelligent harvest monitoring")}</p>
            </div>
            <button onClick={() => {
          setShowAddModal(true);
          setAddStep(1);
        }} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-colors text-sm">
              <FiPlus className="w-5 h-5" />{t("farmer_crops_add_new_crop_3", "Add New Crop")}</button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab('active')} className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'active' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t("farmer_crops_active_crops_4", "Active Crops (")}{activeCrops.length})
            </button>
            <button onClick={() => setActiveTab('harvested')} className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'harvested' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t("farmer_crops_past_crops_history_5", "Past Crops / History (")}{pastCrops.length})
            </button>
          </div>

          {/* Active Crops Grid */}
          {activeTab === 'active' && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeCrops.map(c => <div key={c.id} onClick={() => openCropDetail(c.id)} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {c.crop_id}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">{c.crop_name}</h3>
                        <p className="text-xs text-gray-500">{c.variety || 'Standard'} · {c.area_acres}{t("farmer_crops_acres_6", "Acres")}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.health_status === 'Good' ? 'bg-green-100 text-green-700' : c.health_status === 'Needs Attention' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {c.health_status === 'Good' ? '🟢' : c.health_status === 'Needs Attention' ? '🟡' : '🔴'} {c.health_status || 'Good'}
                      </span>
                    </div>

                    <div className="my-3 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>{t("farmer_crops_current_stage_7", "Current Stage:")}</span>
                        <strong className="text-gray-900">{c.current_stage || 'Active Growth'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("farmer_crops_day_of_growth_8", "Day of Growth:")}</span>
                        <strong className="text-primary-700">{t("farmer_crops_day_9", "Day")}{c.current_day || 1}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("farmer_crops_estimated_harvest_10", "Estimated Harvest:")}</span>
                        <strong className="text-gray-900">{c.estimated_harvest_start ? `${new Date(c.estimated_harvest_start).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })} – ${new Date(c.estimated_harvest_end).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  })}` : 'Calculating...'}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{t("farmer_crops_growth_progress_11", "Growth Progress")}</span>
                        <span>{c.progress_pct || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full transition-all" style={{
                  width: `${c.progress_pct || 10}%`
                }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-primary-600 font-medium">
                    <span>{t("farmer_crops_field_12", "Field:")}{c.field_name || 'Primary Land'}</span>
                    <span>{t("farmer_crops_open_dashboard_13", "Open Dashboard →")}</span>
                  </div>
                </div>)}

              {activeCrops.length === 0 && <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed p-8">
                  <div className="text-5xl mb-3">🌱</div>
                  <h3 className="text-lg font-bold text-gray-800">{t("farmer_crops_no_active_crops_logg_14", "No active crops logged yet")}</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">{t("farmer_crops_register_your_field__15", "Register your field and crop details to automatically generate growth stages, day-by-day task reminders, and AI harvest predictions.")}</p>
                  <button onClick={() => {
            setShowAddModal(true);
            setAddStep(1);
          }} className="bg-primary-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-700">{t("farmer_crops_add_your_first_crop_16", "Add Your First Crop")}</button>
                </div>}
            </div>}

          {/* Past Crops List */}
          {activeTab === 'harvested' && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pastCrops.map(c => <div key={c.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-gray-500">{c.crop_id}</span>
                      <h3 className="text-lg font-bold text-gray-900">{c.crop_name}</h3>
                      <p className="text-xs text-gray-500">{c.variety} · {c.area_acres}{t("farmer_crops_acres_17", "Acres")}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                      <FiCheck className="text-green-600" />{t("farmer_crops_harvested_18", "Harvested")}</span>
                  </div>
                  <div className="my-3 p-3 bg-green-50 rounded-xl space-y-1 text-xs text-green-900">
                    <p>{t("farmer_crops_harvested_on_19", "Harvested on:")}<strong>{c.actual_harvest_date || 'Completed'}</strong></p>
                    <p>{t("farmer_crops_actual_yield_20", "Actual Yield:")}<strong>{c.actual_yield || c.expected_yield} {c.yield_unit || 'quintal'}</strong></p>
                  </div>
                  <button onClick={() => openCropReport(c.id)} className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                    <FiFileText />{t("farmer_crops_view_final_crop_repo_21", "View Final Crop Report")}</button>
                </div>)}
              {pastCrops.length === 0 && <p className="text-gray-400 text-center col-span-full py-12">{t("farmer_crops_no_harvested_crops_i_22", "No harvested crops in archive yet.")}</p>}
            </div>}
        </> : (/* INDIVIDUAL CROP DASHBOARD VIEW */
    <div className="space-y-6">
          {/* Back Button and Actions */}
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedCropId(null)} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
              <FiChevronLeft />{t("farmer_crops_back_to_all_crops_23", "Back to All Crops")}</button>
            {cropDetail?.crop?.status === 'active' && <button onClick={() => setShowHarvestModal(true)} className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm">
                <FiAward />{t("farmer_crops_mark_as_harvested_24", "Mark as Harvested")}</button>}
          </div>

          {loadingDetail ? <div className="text-center py-20 text-gray-400">{t("farmer_crops_loading_crop_lifecyc_25", "Loading Crop Lifecycle Data...")}</div> : cropDetail && <>
                {/* Crop Header Card */}
                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {cropDetail.crop.crop_id}
                        </span>
                        <span className="text-xs text-gray-500">{t("farmer_crops_sown_on_26", "Sown on")}{new Date(cropDetail.crop.sowing_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}</span>
                      </div>
                      <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
                        {cropDetail.crop.crop_name}
                      </h1>
                      <p className="text-sm text-gray-600 mt-0.5">{t("farmer_crops_variety_27", "Variety:")}<strong>{cropDetail.crop.variety || 'Standard'}</strong>{t("farmer_crops_field_28", "· Field:")}<strong>{cropDetail.crop.field_name || 'Primary Land'}</strong> ({cropDetail.crop.area_acres}{t("farmer_crops_acres_29", "Acres)")}</p>
                    </div>

                    {/* Status Highlights */}
                    <div className="flex gap-4">
                      <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-center min-w-[90px]">
                        <p className="text-xs text-primary-700 font-medium">{t("farmer_crops_growth_day_30", "Growth Day")}</p>
                        <p className="text-2xl font-bold text-primary-800">{t("farmer_crops_day_31", "Day")}{cropDetail.crop.current_day}</p>
                      </div>
                      <div className="bg-gray-50 border rounded-xl p-3 text-center min-w-[120px]">
                        <p className="text-xs text-gray-500 font-medium">{t("farmer_crops_current_stage_32", "Current Stage")}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{cropDetail.crop.current_stage}</p>
                      </div>
                      <div className="bg-gray-50 border rounded-xl p-3 text-center min-w-[90px]">
                        <p className="text-xs text-gray-500 font-medium">{t("farmer_crops_health_33", "Health")}</p>
                        <p className="text-sm font-bold text-green-700 mt-1">🟢 {cropDetail.crop.health_status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5 pt-4 border-t space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                      <span>{t("farmer_crops_overall_lifecycle_pr_34", "Overall Lifecycle Progress (Estimated")}{cropDetail.crop.total_duration_days}{t("farmer_crops_days_35", "Days)")}</span>
                      <span>{cropDetail.crop.progress_pct}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full transition-all" style={{
                width: `${cropDetail.crop.progress_pct}%`
              }} />
                    </div>
                  </div>
                </div>

                {/* AI Harvest Prediction Box */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-purple-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-purple-800 font-bold text-sm">
                        <span>🤖</span>{t("farmer_crops_ai_harvest_window_pr_36", "AI Harvest Window Prediction")}<span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">{t("farmer_crops_estimate_37", "ESTIMATE")}</span>
                      </div>
                      <h3 className="text-2xl font-black text-purple-950 mt-1">
                        {cropDetail.crop.estimated_harvest_start ? `${new Date(cropDetail.crop.estimated_harvest_start).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short'
                })} – ${new Date(cropDetail.crop.estimated_harvest_end).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short'
                })}` : 'Calculating Window'}
                      </h3>
                      <p className="text-xs text-purple-700 mt-1 max-w-2xl">
                        <strong>{t("farmer_crops_most_likely_date_38", "Most Likely Date:")}</strong> {cropDetail.crop.most_likely_harvest_date ? new Date(cropDetail.crop.most_likely_harvest_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'TBD'}{t("farmer_crops_confidence_39", "(Confidence:")}{(cropDetail.crop.prediction_confidence * 100).toFixed(0)}%)
                      </p>
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {cropDetail.crop.prediction_reason}
                      </p>
                    </div>

                    {cropDetail.prediction_history?.length > 1 && <div className="text-right text-xs bg-white/70 p-2.5 rounded-xl border border-purple-200">
                        <p className="font-semibold text-purple-800 flex items-center gap-1 justify-end">
                          <FiRefreshCw className="w-3 h-3" />{t("farmer_crops_prediction_updated_40", "Prediction Updated")}</p>
                        <p className="text-gray-500">{t("farmer_crops_originally_41", "Originally:")}{cropDetail.prediction_history[cropDetail.prediction_history.length - 1]?.new_window}</p>
                      </div>}
                  </div>
                </div>

                {/* Growth Stage Visual Timeline */}
                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-primary-600" />{t("farmer_crops_crop_growth_timeline_42", "Crop Growth Timeline")}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {cropDetail.timeline?.map((st, i) => <div key={i} className={`p-3 rounded-xl border transition-all ${st.status === 'current' ? 'border-primary-500 bg-primary-50/80 ring-2 ring-primary-400' : st.status === 'completed' ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-500">{t("farmer_crops_stage_43", "Stage")}{i + 1}</span>
                          <span className="text-sm">
                            {st.status === 'completed' ? '✓' : st.status === 'current' ? '●' : '○'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 truncate" title={st.name}>{st.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{t("farmer_crops_days_44", "Days")}{st.start_day}–{st.end_day}</p>
                        {st.status === 'current' && <span className="inline-block mt-2 text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded font-semibold">{t("farmer_crops_current_45", "CURRENT")}</span>}
                      </div>)}
                  </div>
                </div>

                {/* 2-Column: Daily Tracker (Left) & Weather + AI Photo (Right) */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Today's Daily Tracker */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <FiCheckSquare className="text-primary-600" />{t("farmer_crops_today_s_field_checkl_46", "Today's Field Checklist (Day")}{cropDetail.crop.current_day})
                        </h3>
                        <p className="text-xs text-gray-500">{t("farmer_crops_update_daily_tasks_a_47", "Update daily tasks and observations with simple 1-click controls")}</p>
                      </div>
                      <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                        {cropDetail.crop.current_stage}
                      </span>
                    </div>

                    {/* Interactive Tasks Checklist */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">{t("farmer_crops_stage_activities_to__48", "Stage Activities to Check:")}</label>
                      <div className="space-y-2">
                        {trackerTasks.map((t, idx) => <label key={idx} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${t.completed ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}`}>
                            <input type="checkbox" checked={t.completed || false} onChange={() => {
                    const copy = [...trackerTasks];
                    copy[idx].completed = !copy[idx].completed;
                    setTrackerTasks(copy);
                  }} className="w-4 h-4 text-primary-600 rounded" />
                            <span className="text-xs font-medium">{t.task}</span>
                          </label>)}
                      </div>
                    </div>

                    {/* Quick Button Selectors: Health, Irrigation, Pests */}
                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">{t("farmer_crops_crop_health_49", "Crop Health")}</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['Good', 'Needs Attention', 'Poor'].map(h => <button key={h} type="button" onClick={() => setTrackerHealth(h)} className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${trackerHealth === h ? h === 'Good' ? 'bg-green-600 text-white border-green-600' : h === 'Needs Attention' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                              {h === 'Good' ? '🟢 Good' : h === 'Needs Attention' ? '🟡 Care' : '🔴 Poor'}
                            </button>)}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">{t("farmer_crops_irrigation_status_50", "Irrigation Status")}</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['Done', 'Not Done', 'Not Required'].map(irr => <button key={irr} type="button" onClick={() => setTrackerIrrigation(irr)} className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${trackerIrrigation === irr ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                              {irr}
                            </button>)}
                        </div>
                      </div>
                    </div>

                    {/* Pest and Disease Pills */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">{t("farmer_crops_pest_symptoms_51", "Pest Symptoms")}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['None', 'Observed'].map(p => <button key={p} type="button" onClick={() => setTrackerPest(p)} className={`py-2 rounded-xl text-xs font-medium border text-center ${trackerPest === p ? p === 'None' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300 font-bold' : 'bg-white text-gray-600'}`}>
                              {p === 'None' ? '✓ None' : '⚠ Observed'}
                            </button>)}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">{t("farmer_crops_disease_symptoms_52", "Disease Symptoms")}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['None', 'Observed'].map(d => <button key={d} type="button" onClick={() => setTrackerDisease(d)} className={`py-2 rounded-xl text-xs font-medium border text-center ${trackerDisease === d ? d === 'None' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300 font-bold' : 'bg-white text-gray-600'}`}>
                              {d === 'None' ? '✓ None' : '⚠ Observed'}
                            </button>)}
                        </div>
                      </div>
                    </div>

                    {/* Farmer Notes */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">{t("farmer_crops_field_notes_optional_53", "Field Notes (Optional)")}</label>
                      <input type="text" placeholder={t("farmer_crops_e_g_applied_micronut_54", "e.g. Applied micronutrient spray in morning, soil moisture looking good...")} value={trackerNotes} onChange={e => setTrackerNotes(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <button onClick={handleSaveDailyLog} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm">{t("farmer_crops_save_today_s_daily_u_55", "Save Today's Daily Update")}</button>
                  </div>

                  {/* Right Col: Weather & AI Photo Screening */}
                  <div className="space-y-6">
                    {/* Field Weather Box */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <FiCloudRain className="text-blue-500" />{t("farmer_crops_field_microclimate_56", "Field Microclimate")}</h3>
                      <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl text-blue-950">
                        <div>
                          <span className="text-3xl font-black">{cropDetail.weather?.temp}{t("farmer_crops_c_57", "°C")}</span>
                          <p className="text-xs text-blue-700">{cropDetail.weather?.condition}</p>
                        </div>
                        <div className="text-right text-xs space-y-0.5 text-blue-800">
                          <p>{t("farmer_crops_humidity_58", "Humidity:")}<strong>{cropDetail.weather?.humidity}%</strong></p>
                          <p>{t("farmer_crops_wind_59", "Wind:")}<strong>{t("farmer_crops_14_km_h_60", "14 km/h")}</strong></p>
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-900">
                        <strong>{t("farmer_crops_smart_weather_adviso_61", "Smart Weather Advisory:")}</strong> {cropDetail.weather?.advisory}
                      </div>
                    </div>

                    {/* AI Photo Observation Box */}
                    <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <FiCamera className="text-purple-600" />{t("farmer_crops_ai_crop_photo_screen_62", "AI Crop Photo Screening")}</h3>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">{t("farmer_crops_ai_assist_63", "AI ASSIST")}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t("farmer_crops_upload_or_capture_a__64", "Upload or capture a leaf photo to screen for visible pest damage or fungal symptoms.")}</p>

                      <button onClick={handleRunAIPhoto} className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                        <FiCamera />{t("farmer_crops_take_upload_crop_pho_65", "Take / Upload Crop Photo & Analyze")}</button>

                      {cropDetail.ai_observations && cropDetail.ai_observations.length > 0 && <div className="mt-3 p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1.5">
                          <div className="flex justify-between items-start">
                            <strong className="text-purple-900">{t("farmer_crops_ai_observation_66", "AI Observation:")}</strong>
                            <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                              {(cropDetail.ai_observations[0].confidence * 100).toFixed(0)}{t("farmer_crops_confidence_67", "% Confidence")}</span>
                          </div>
                          <p className="text-gray-700">{cropDetail.ai_observations[0].observation}</p>
                          <div className="p-2 bg-white rounded-lg border text-purple-950 font-medium">
                            {cropDetail.ai_observations[0].possible_issue}
                          </div>
                          <p className="text-[11px] text-gray-600">
                            <strong>{t("farmer_crops_recommended_next_ste_68", "Recommended next step:")}</strong> {cropDetail.ai_observations[0].recommendation}
                          </p>
                        </div>}
                    </div>
                  </div>
                </div>

                {/* Daily Log History */}
                {cropDetail.logs_history && cropDetail.logs_history.length > 0 && <div className="bg-white rounded-2xl border p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FiClock className="text-primary-600" />{t("farmer_crops_recent_daily_log_his_69", "Recent Daily Log History")}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                          <tr>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_day_70", "Day")}</th>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_date_71", "Date")}</th>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_stage_72", "Stage")}</th>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_health_73", "Health")}</th>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_irrigation_74", "Irrigation")}</th>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_pest_disease_75", "Pest / Disease")}</th>
                            <th className="py-2.5 px-3 text-left">{t("farmer_crops_notes_76", "Notes")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-gray-800">
                          {cropDetail.logs_history.map(l => <tr key={l.id} className="hover:bg-gray-50">
                              <td className="py-2.5 px-3 font-bold text-primary-700">{t("farmer_crops_day_77", "Day")}{l.day_number}</td>
                              <td className="py-2.5 px-3">{l.log_date}</td>
                              <td className="py-2.5 px-3">{l.stage}</td>
                              <td className="py-2.5 px-3 font-semibold">{l.health_status}</td>
                              <td className="py-2.5 px-3">{l.irrigation_status}</td>
                              <td className="py-2.5 px-3">{l.pest_observation === 'Observed' ? '⚠ Pest Observed' : l.disease_observation === 'Observed' ? '⚠ Disease Observed' : 'None'}</td>
                              <td className="py-2.5 px-3 truncate max-w-xs">{l.notes || '-'}</td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>}
              </>}
        </div>)}

      {/* ========================================================== */}
      {/* MULTI-STEP ADD CROP WIZARD MODAL */}
      {/* ========================================================== */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Register Crop — Step ${addStep} of 3`} size="lg">
        <form onSubmit={addStep === 3 ? handleAddCrop : e => {
        e.preventDefault();
        setAddStep(s => s + 1);
      }} className="space-y-4">
          {/* STEP 1: LAND / FIELD DETAILS */}
          {addStep === 1 && <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-xl text-xs text-primary-800 font-medium">{t("farmer_crops_step_1_specify_land__78", "STEP 1: Specify land and field conditions across India to calibrate soil moisture and duration parameters.")}</div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_field_name_land_id_79", "Field Name / Land ID")}</label>
                  <input type="text" placeholder={t("farmer_crops_e_g_north_plot_khasr_80", "e.g. North Plot / Khasra 42")} value={form.field_name} onChange={e => u('field_name', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_cultivated_area_acre_81", "Cultivated Area (Acres)")}</label>
                  <input type="number" step="0.1" placeholder={t("farmer_crops_e_g_2_5_82", "e.g. 2.5")} value={form.cultivated_area_acres} onChange={e => u('cultivated_area_acres', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
              </div>

              {/* Pan-India Location Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">{t("farmer_crops_state_ut_83", "State / UT (")}{states.length})</label>
                  <select value={form.location_state} onChange={e => {
                u('location_state', e.target.value);
                u('location_district', '');
                u('location_village', '');
              }} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white font-medium" required>
                    <option value="">{t("farmer_crops_select_state_84", "Select State")}</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">{t("farmer_crops_district_85", "District (")}{districts.length})</label>
                  <select value={form.location_district} onChange={e => {
                u('location_district', e.target.value);
                u('location_village', '');
              }} disabled={!form.location_state} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium" required>
                    <option value="">{t("farmer_crops_select_district_86", "Select District")}</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">{t("farmer_crops_village_taluka_87", "Village / Taluka")}</label>
                  <input type="text" list="crop-village-suggestions" placeholder={form.location_district ? "Select or type village..." : "Select district first"} value={form.location_village} onChange={e => u('location_village', e.target.value)} disabled={!form.location_district} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium" required />
                  <datalist id="crop-village-suggestions">
                    {villages.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_soil_type_88", "Soil Type")}</label>
                  <select value={form.soil_type} onChange={e => u('soil_type', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white">
                    {['Loamy Soil', 'Black Clay Soil', 'Red Sandy Loam', 'Alluvial Soil', 'Sandy Soil'].map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_irrigation_system_89", "Irrigation System")}</label>
                  <select value={form.irrigation_type} onChange={e => u('irrigation_type', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white">
                    {['Drip Irrigation', 'Sprinkler System', 'Canal / Flood', 'Borewell / Tube-well', 'Rainfed'].map(ir => <option key={ir} value={ir}>{ir}</option>)}
                  </select>
                </div>
              </div>
            </div>}

          {/* STEP 2: CROP DETAILS (WITH OTHER OPTION) */}
          {addStep === 2 && <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-xl text-xs text-primary-800 font-medium">{t("farmer_crops_step_2_enter_crop_an_90", "STEP 2: Enter crop and seed specifications. Select \"Other\" to track any custom specialty crop.")}</div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_crop_name_91", "Crop Name")}</label>
                  <select value={form.crop_name} onChange={e => u('crop_name', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-white font-medium" required>
                    {['Wheat', 'Tomato', 'Onion', 'Potato', 'Rice', 'Soybean', 'Cotton', 'Maize', 'Mustard', 'Chilli', 'Other'].map(c => <option key={c} value={c}>{c === 'Other' ? '★ Other / Custom Crop' : c}</option>)}
                  </select>
                </div>

                {form.crop_name === 'Other' ? <div>
                    <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_enter_custom_crop_na_92", "Enter Custom Crop Name")}</label>
                    <input type="text" placeholder={t("farmer_crops_e_g_dragon_fruit_tur_93", "e.g. Dragon Fruit, Turmeric, Ginger...")} value={form.custom_crop_name} onChange={e => u('custom_crop_name', e.target.value)} className="w-full px-3 py-2.5 border border-primary-400 bg-primary-50/40 rounded-xl text-sm outline-none" required />
                  </div> : <div>
                    <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_crop_variety_94", "Crop Variety")}</label>
                    <input type="text" placeholder={t("farmer_crops_e_g_abhinav_hybrid_h_95", "e.g. Abhinav Hybrid / HD-2967")} value={form.variety} onChange={e => u('variety', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" />
                  </div>}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_sowing_planting_date_96", "Sowing / Planting Date")}</label>
                  <input type="date" value={form.sowing_date} onChange={e => u('sowing_date', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" required />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_seed_quantity_used_97", "Seed Quantity Used")}</label>
                  <input type="number" step="0.5" placeholder={t("farmer_crops_e_g_40_kg_98", "e.g. 40 kg")} value={form.seed_quantity} onChange={e => u('seed_quantity', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_expected_yield_99", "Expected Yield")}</label>
                  <div className="flex gap-2">
                    <input type="number" step="0.5" placeholder={t("farmer_crops_e_g_35_100", "e.g. 35")} value={form.expected_yield} onChange={e => u('expected_yield', e.target.value)} className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none" required />
                    <select value={form.yield_unit} onChange={e => u('yield_unit', e.target.value)} className="w-28 px-2 py-2 border rounded-xl text-xs bg-white outline-none">
                      <option value="quintal">{t("farmer_crops_quintal_101", "quintal")}</option>
                      <option value="ton">{t("farmer_crops_ton_102", "ton")}</option>
                      <option value="kg">{t("farmer_crops_kg_103", "kg")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_farming_method_104", "Farming Method")}</label>
                  <select value={form.farming_method} onChange={e => u('farming_method', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs bg-white outline-none">
                    <option value="Conventional">{t("farmer_crops_conventional_chemica_105", "Conventional Chemical")}</option>
                    <option value="Organic Certified">{t("farmer_crops_organic_certified_106", "Organic Certified")}</option>
                    <option value="Natural Farming (ZBNF)">{t("farmer_crops_natural_farming_zbnf_107", "Natural Farming (ZBNF)")}</option>
                    <option value="Integrated Pest Mgmt (IPM)">{t("farmer_crops_integrated_pest_mgmt_108", "Integrated Pest Mgmt (IPM)")}</option>
                  </select>
                </div>
              </div>
            </div>}

          {/* STEP 3: FARMING CONDITIONS */}
          {addStep === 3 && <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-xl text-xs text-primary-800 font-medium">{t("farmer_crops_step_3_fertilizer_so_109", "STEP 3: Fertilizer & soil baseline. The AI will use these parameters to forecast your harvest window.")}</div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_fertilizer_nutrition_110", "Fertilizer & Nutrition Applied")}</label>
                <input type="text" placeholder={t("farmer_crops_e_g_basal_dap_50kg_z_111", "e.g. Basal DAP 50kg + Zinc Sulfate 10kg + FYM 2 tons")} value={form.fertilizer_info} onChange={e => u('fertilizer_info', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_previous_crop_in_thi_112", "Previous Crop in this Field")}</label>
                <input type="text" placeholder={t("farmer_crops_e_g_soybean_kharif_s_113", "e.g. Soybean (Kharif season)")} value={form.previous_crop_field} onChange={e => u('previous_crop_field', e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none" />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_additional_notes_114", "Additional Notes")}</label>
                <textarea rows="2" placeholder={t("farmer_crops_any_soil_health_obse_115", "Any soil health observations or water availability remarks...")} value={form.notes} onChange={e => u('notes', e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm outline-none" />
              </div>
            </div>}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-3 border-t">
            {addStep > 1 ? <button type="button" onClick={() => setAddStep(s => s - 1)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border rounded-xl">{t("farmer_crops_previous_step_116", "← Previous Step")}</button> : <div />}

            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors">
              {addStep === 3 ? 'Create Crop Cycle & Predict Harvest' : 'Continue to Next Step &rarr;'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================== */}
      {/* MARK AS HARVESTED MODAL */}
      {/* ========================================================== */}
      <Modal isOpen={showHarvestModal} onClose={() => setShowHarvestModal(false)} title={t("farmer_crops_mark_crop_as_harvest_117", "Mark Crop as Harvested")}>
        <form onSubmit={handleHarvestSubmit} className="space-y-4">
          <div className="p-3 bg-green-50 rounded-xl text-xs text-green-900">{t("farmer_crops_completing_this_crop_118", "Completing this crop cycle will log your actual yield and compare it against the initial AI estimate.")}</div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_actual_harvest_date_119", "Actual Harvest Date")}</label>
              <input type="date" value={harvestForm.actual_harvest_date} onChange={e => setHarvestForm(h => ({
              ...h,
              actual_harvest_date: e.target.value
            }))} className="w-full px-3 py-2 border rounded-xl text-sm outline-none" required />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_actual_harvested_yie_120", "Actual Harvested Yield")}</label>
              <div className="flex gap-2">
                <input type="number" step="0.1" placeholder={t("farmer_crops_e_g_34_5_121", "e.g. 34.5")} value={harvestForm.actual_yield} onChange={e => setHarvestForm(h => ({
                ...h,
                actual_yield: e.target.value
              }))} className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none" required />
                <span className="px-3 py-2 bg-gray-100 border rounded-xl text-xs flex items-center font-medium">
                  {cropDetail?.crop?.yield_unit || 'quintal'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_quality_grade_122", "Quality Grade")}</label>
            <select value={harvestForm.quality_grade} onChange={e => setHarvestForm(h => ({
            ...h,
            quality_grade: e.target.value
          }))} className="w-full px-3 py-2 border rounded-xl text-sm outline-none bg-white">
              <option value="Grade A">{t("farmer_crops_grade_a_premium_clea_123", "Grade A (Premium / Clean / Healthy)")}</option>
              <option value="Grade B">{t("farmer_crops_grade_b_standard_mar_124", "Grade B (Standard Market Grade)")}</option>
              <option value="Grade C">{t("farmer_crops_grade_c_processing_g_125", "Grade C (Processing Grade)")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">{t("farmer_crops_harvest_notes_126", "Harvest Notes")}</label>
            <textarea rows="2" value={harvestForm.notes} onChange={e => setHarvestForm(h => ({
            ...h,
            notes: e.target.value
          }))} className="w-full px-3 py-2 border rounded-xl text-sm outline-none" placeholder={t("farmer_crops_e_g_harvested_early__127", "e.g. Harvested early morning, threshing completed successfully.")} />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm shadow-sm">{t("farmer_crops_confirm_harvest_gene_128", "Confirm Harvest & Generate Final Report")}</button>
        </form>
      </Modal>

      {/* ========================================================== */}
      {/* FINAL CROP REPORT MODAL */}
      {/* ========================================================== */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={t("farmer_crops_final_crop_performan_129", "Final Crop Performance Report")} size="lg">
        {reportData && <div className="space-y-4 text-xs">
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="font-mono text-primary-700 font-bold">{reportData.crop.crop_id}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">{reportData.crop.crop_name} ({reportData.crop.variety})</h3>
                <p className="text-gray-500">{t("farmer_crops_field_130", "Field:")}{reportData.crop.field_name}{t("farmer_crops_area_131", "· Area:")}{reportData.crop.area_acres}{t("farmer_crops_acres_132", "Acres")}</p>
              </div>
              <span className="bg-green-600 text-white px-3 py-1.5 rounded-full font-bold text-xs">{t("farmer_crops_status_harvested_133", "STATUS: HARVESTED")}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-gray-500">{t("farmer_crops_sowing_date_134", "Sowing Date")}</p>
                <p className="text-sm font-bold text-gray-800">{reportData.crop.sowing_date}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-gray-500">{t("farmer_crops_actual_harvest_135", "Actual Harvest")}</p>
                <p className="text-sm font-bold text-green-700">{reportData.harvest.actual_harvest_date}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-gray-500">{t("farmer_crops_total_duration_136", "Total Duration")}</p>
                <p className="text-sm font-bold text-gray-800">{reportData.harvest.duration_days || reportData.crop.total_duration_days}{t("farmer_crops_days_137", "Days")}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-gray-500">{t("farmer_crops_quality_grade_138", "Quality Grade")}</p>
                <p className="text-sm font-bold text-blue-700">{reportData.harvest.quality_grade || 'Grade A'}</p>
              </div>
            </div>

            {/* Yield Comparison Box */}
            <div className="p-4 bg-white border rounded-xl space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                <FiActivity className="text-primary-600" />{t("farmer_crops_yield_analysis_139", "Yield Analysis")}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">{t("farmer_crops_initial_target_yield_140", "Initial Target Yield:")}</span>
                  <p className="text-lg font-bold text-gray-800">{reportData.crop.expected_yield} {reportData.harvest.yield_unit}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-green-800">{t("farmer_crops_actual_realized_yiel_141", "Actual Realized Yield:")}</span>
                  <p className="text-lg font-bold text-green-700">{reportData.harvest.actual_yield} {reportData.harvest.yield_unit}</p>
                </div>
              </div>
            </div>

            {/* Prediction Window Accuracy */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl">
              <h4 className="font-bold text-purple-900 mb-1">{t("farmer_crops_ai_prediction_accura_142", "AI Prediction Accuracy")}</h4>
              <p className="text-gray-700">{t("farmer_crops_ai_estimated_harvest_143", "AI estimated harvest window was")}<strong>{reportData.crop.estimated_harvest_start}{t("farmer_crops_to_144", "to")}{reportData.crop.estimated_harvest_end}</strong>{t("farmer_crops_actual_harvest_occur_145", ". Actual harvest occurred on")}<strong>{reportData.harvest.actual_harvest_date}</strong>.
              </p>
            </div>

            <button onClick={() => setShowReportModal(false)} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-medium">{t("farmer_crops_close_report_146", "Close Report")}</button>
          </div>}
      </Modal>
    </div>;
}