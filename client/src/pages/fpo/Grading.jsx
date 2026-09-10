import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import {
  FiCamera, FiUpload, FiCheckCircle, FiAlertTriangle, FiRefreshCw,
  FiEye, FiCheck, FiAward, FiTag, FiClock, FiFileText, FiLayers
} from 'react-icons/fi';

const PRODUCE_TYPES = [
  'Tomato', 'Potato', 'Onion', 'Wheat', 'Rice', 'Soybean', 'Maize', 'Carrot', 'Garlic', 'Chilli'
];

export default function Grading() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  // Form & Image states
  const [selectedProduce, setSelectedProduce] = useState('Potato');
  const [weighedLots, setWeighedLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Result states
  const [aiResult, setAiResult] = useState(null);
  const [finalGrade, setFinalGrade] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverridden, setIsOverridden] = useState(false);

  // History & Modal states
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch weighed lots & grading history on mount
  useEffect(() => {
    loadWeighedLots();
    loadHistory();
  }, [user?.fpo_id]);

  const loadWeighedLots = async () => {
    try {
      const res = await axios.get(`/api/lots?fpo_id=${user?.fpo_id || 1}&status=weighed`);
      setWeighedLots(res.data.lots || []);
    } catch {
      // Non-critical fallback
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/ai/grading-history');
      setHistory(res.data.records || []);
    } catch (err) {
      console.error('Failed to load grading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('common_error', 'Please upload a valid image file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
      setAiResult(null);
      setFinalGrade('');
      setIsOverridden(false);
      setOverrideReason('');
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Vision Grading
  const handleAnalyze = async () => {
    if (!imageBase64) {
      toast.error(t('common_error', 'Please select or capture a produce photo first'));
      return;
    }

    setAnalyzing(true);
    try {
      const res = await axios.post('/api/ai/grade-image', {
        imageBase64,
        produceType: selectedProduce
      });

      const raw = res.data;
      const isUncertain = raw.status === 'uncertain' || raw.uncertainty_flag || !raw.canGrade;
      const normalized = {
        ...raw,
        uncertainty_flag: isUncertain,
        confidence: raw.confidence || 0.9,
        confidence_pct: raw.confidence_pct || raw.confidencePercentage || Math.round((raw.confidence || 0.9) * 100),
        observations: Array.isArray(raw.aiObservations) ? raw.aiObservations.join('. ') : (raw.observations || raw.message || 'Visual inspection complete'),
        defects_detected: raw.defects_detected || (raw.defectPercentage ? [`${raw.defectPercentage}% defect surface marks`] : [])
      };
      setAiResult(normalized);

      if (isUncertain) {
        setFinalGrade('');
        setIsOverridden(false);
        toast.error(raw.message || t('common_error', 'Unable to determine quality reliably'));
      } else {
        setFinalGrade(normalized.grade);
        setIsOverridden(false);
        toast.success(`AI Classified: Grade ${normalized.grade} (${normalized.confidence_pct}%)`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('common_error', 'AI grading failed'));
    } finally {
      setAnalyzing(false);
    }
  };

  // Manual Override action
  const handleManualOverride = (grade) => {
    setFinalGrade(grade);
    setIsOverridden(true);
    toast.success(`Grade updated manually to Grade ${grade}`);
  };

  // Save Grading Record
  const handleSaveRecord = async () => {
    if (!finalGrade) {
      toast.error(t('common_error', 'Please complete AI grading or select a final grade'));
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/ai/grade-record', {
        lot_id: selectedLotId || undefined,
        produce_type: selectedProduce,
        ai_grade: aiResult?.grade || finalGrade,
        final_grade: finalGrade,
        confidence_score: aiResult?.confidence || 1.0,
        observations: aiResult?.observations || `Visual inspection confirmed Grade ${finalGrade}`,
        image_url: imagePreview,
        graded_by: user?.name || 'FPO Officer',
        is_override: isOverridden ? 1 : 0,
        override_reason: isOverridden ? (overrideReason || 'Officer judgment') : null
      });

      toast.success(t('common_success', 'Grading record saved successfully!'));
      // Reset form
      setImagePreview(null);
      setImageBase64('');
      setAiResult(null);
      setFinalGrade('');
      setSelectedLotId('');
      setIsOverridden(false);
      setOverrideReason('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadHistory();
      loadWeighedLots();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common_error', 'Failed to save grading record'));
    } finally {
      setSaving(false);
    }
  };

  const gradeColor = (g) => {
    switch (g) {
      case 'A': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🔍</span> {t('fpo_grading_title', 'AI Produce Quality Grading')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('fpo_grading_subtitle', 'Upload produce photos for automated computer vision defect detection, uniformity scoring, and Grade A/B/C assignment with manual override.')}
        </p>
      </div>

      {/* Main Grading Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Produce Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FiCamera className="text-primary-600" /> {t('fpo_grading_upload_photo', 'Upload Produce Photo')}
            </h2>

            {/* Produce Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('fpo_grading_commodity', 'Produce Commodity')}
              </label>
              <select
                value={selectedProduce}
                onChange={(e) => {
                  setSelectedProduce(e.target.value);
                  setAiResult(null);
                  setFinalGrade('');
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {PRODUCE_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Optional Weighed Lot Association */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('fpo_grading_associate_lot', 'Associate with Lot (Optional)')}
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">{t('fpo_grading_no_lot_linked', '-- No Lot Linked (Standalone Inspection) --')}</option>
                {weighedLots.map((l) => (
                  <option key={l.id} value={l.lot_id}>
                    {l.lot_id} · {l.crop_type} ({l.weight_kg} kg) - {l.farmer_name || 'Farmer'}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Uploader / Preview Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('fpo_grading_sample_image', 'Produce Sample Image')}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  imagePreview ? 'border-primary-400 bg-primary-50/20' : 'border-gray-300 hover:border-primary-400 bg-gray-50'
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="Uploaded produce preview"
                      className="w-full h-52 object-contain rounded-lg shadow-sm mx-auto"
                    />
                    <p className="text-xs text-primary-700 font-medium">{t('fpo_grading_click_replace', 'Click to replace photo')}</p>
                  </div>
                ) : (
                  <div className="py-8 space-y-2">
                    <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto">
                      <FiUpload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {t('fpo_grading_take_photo', 'Take photo or upload produce image')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('fpo_grading_supports', 'Supports JPG, PNG, WebP (Potatoes, Tomatoes, Onions, Wheat, etc.)')}
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleAnalyze}
              disabled={!imagePreview || analyzing}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  {t('fpo_grading_analyzing', 'Analyzing defects & uniformity...')}
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  {t('fpo_grading_analyze', 'Analyze Produce with AI')}
                </>
              )}
            </button>
          </div>

          {/* Quality Categories Reference Guide */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-xs space-y-2.5">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">{t('fpo_grading_quality_standards', 'Quality Standards')}</h3>
            <div className="flex items-start gap-2 text-gray-700">
              <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">{t('fpo_grading_grade_a', 'Grade A')}</span>
              <span><strong>{t('fpo_grading_best_quality', 'Best Quality:')}</strong> High uniformity, vibrant color, defect-free. For premium & export.</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <span className="px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-800 text-[10px]">{t('fpo_grading_grade_b', 'Grade B')}</span>
              <span><strong>{t('fpo_grading_medium_quality', 'Medium Quality:')}</strong> Minor surface marks, slight irregularity. For standard wholesale.</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <span className="px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-800 text-[10px]">{t('fpo_grading_grade_c', 'Grade C')}</span>
              <span><strong>{t('fpo_grading_processing', 'Processing:')}</strong> Visible cuts, bruises, irregular shape. Sent for secondary processing.</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Result, Manual Override & Save (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('fpo_grading_ai_inspection', 'AI Inspection & Classification')}</h2>
                  <p className="text-xs text-gray-500">{t('fpo_grading_ai_details', 'Detailed defect breakdown, confidence score, and classification')}</p>
                </div>
                {aiResult && !aiResult.uncertainty_flag && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${gradeColor(aiResult.grade)}`}>
                    {t('fpo_grading_ai_grade', 'AI Grade')} {aiResult.grade}
                  </span>
                )}
              </div>

              {!aiResult && !analyzing && (
                <div className="py-16 text-center text-gray-400 space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 text-2xl">
                    🌾
                  </div>
                  <p className="text-sm font-medium text-gray-600">{t('fpo_grading_no_image', 'No produce image analyzed yet')}</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    {t('fpo_grading_select_produce', 'Select a produce commodity on the left and upload a clear photo to receive an instant AI quality appraisal.')}
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-gray-800">{t('fpo_grading_processing_pixels', 'Processing produce pixels with vision AI...')}</p>
                  <p className="text-xs text-gray-500">{t('fpo_grading_checking_surface', 'Checking surface blemishes, decay, and size uniformity')}</p>
                </div>
              )}

              {/* Uncertainty Warning */}
              {aiResult?.uncertainty_flag && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 my-4">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <FiAlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>{t('fpo_grading_quality_ambiguity', 'Quality Ambiguity Detected')}</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {aiResult.message || 'Unable to determine quality reliably. Please retake photo with clearer lighting and focus on the produce.'}
                  </p>
                </div>
              )}

              {/* Valid AI Result Card */}
              {aiResult && !aiResult.uncertainty_flag && (
                <div className="space-y-5">
                  {/* Grade Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t('fpo_grading_suggested', 'Suggested Classification')}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-3xl font-extrabold text-gray-900">
                          {t('common_grade', 'Grade')} {aiResult.grade}
                        </span>
                        <span className="text-sm font-semibold text-gray-600">
                          {aiResult.grade === 'A' && t('fpo_grading_best_premium', '— Best Quality (Premium)')}
                          {aiResult.grade === 'B' && t('fpo_grading_medium_standard', '— Medium Quality (Standard)')}
                          {aiResult.grade === 'C' && t('fpo_grading_processing_required', '— Processing Required')}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs font-semibold text-gray-500 block">{t('fpo_grading_confidence_score', 'Confidence Score')}</span>
                      <span className="text-2xl font-bold text-primary-700">{aiResult.confidence_pct}%</span>
                    </div>
                  </div>

                  {/* Confidence Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                      <span>{t('fpo_grading_vision_confidence', 'Vision Confidence')}</span>
                      <span>{aiResult.confidence_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          aiResult.confidence_pct >= 85 ? 'bg-emerald-500' : aiResult.confidence_pct >= 65 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${aiResult.confidence_pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Observations & Inspection Findings */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{t('fpo_grading_inspection_observations', 'Inspection Observations')}</p>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      "{aiResult.observations}"
                    </p>
                    {aiResult.defects_detected && aiResult.defects_detected.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs text-gray-500">{t('fpo_grading_identified_traits', 'Identified Traits:')}</span>
                        {aiResult.defects_detected.map((d, idx) => (
                          <span key={idx} className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Override Section */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        {t('fpo_grading_manual_override', 'FPO Officer Manual Override')}
                      </label>
                      {isOverridden && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          {t('fpo_grading_overridden', 'Overridden manually')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {t('fpo_grading_override_prompt', 'If produce condition differs from AI classification, select the corrected grade:')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleManualOverride('A')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          finalGrade === 'A'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {t('fpo_grading_grade_a_best', 'Grade A (Best)')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualOverride('B')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          finalGrade === 'B'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {t('fpo_grading_grade_b_medium', 'Grade B (Medium)')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualOverride('C')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          finalGrade === 'C'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        {t('fpo_grading_grade_c_processing', 'Grade C (Processing)')}
                      </button>
                    </div>

                    {isOverridden && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder={t('fpo_grading_reason_override', 'Reason for override (e.g. skin firmness, moisture check)...')}
                          className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-amber-50/50 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            {aiResult && (
              <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  {t('fpo_grading_final_decision', 'Final Decision:')} <span className="font-bold text-gray-800">{t('common_grade', 'Grade')} {finalGrade || t('common_none', 'None')}</span>
                  {isOverridden && ` ${t('fpo_grading_manual_override_tag', '(Manual Override)')}`}
                </div>
                <button
                  onClick={handleSaveRecord}
                  disabled={!finalGrade || saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      {t('common_saving', 'Saving...')}
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      {t('fpo_grading_confirm_save', 'Confirm & Save Grading')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading History Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiClock className="text-primary-600" /> {t('fpo_grading_history_log', 'Quality Grading History & Log')}
            </h2>
            <p className="text-xs text-gray-500">{t('fpo_grading_persistent_log', 'Persistent log of all produce samples inspected by AI or overridden by officers')}</p>
          </div>
          <button
            onClick={loadHistory}
            className="p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('common_refresh_data', 'Refresh data')}
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-gray-400 text-sm">{t('fpo_grading_loading_history', 'Loading grading history...')}</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">{t('fpo_grading_no_records', 'No grading records found yet.')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-y">
                <tr>
                  <th className="py-3 px-4">{t('common_produce', 'Produce')}</th>
                  <th className="py-3 px-4">{t('common_lot_id', 'Lot ID')}</th>
                  <th className="py-3 px-4">{t('fpo_grading_ai_grade', 'AI Grade')}</th>
                  <th className="py-3 px-4">{t('common_final_grade', 'Final Grade')}</th>
                  <th className="py-3 px-4">{t('common_confidence', 'Confidence')}</th>
                  <th className="py-3 px-4">{t('fpo_grading_class_source', 'Classification Source')}</th>
                  <th className="py-3 px-4">{t('common_timestamp', 'Timestamp')}</th>
                  <th className="py-3 px-4 text-right">{t('common_action', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                      {rec.produce_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {rec.lot_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {rec.ai_grade || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${gradeColor(rec.final_grade)}`}>
                        {t('common_grade', 'Grade')} {rec.final_grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {Math.round((rec.confidence_score || 0) * 100)}%
                    </td>
                    <td className="py-3 px-4">
                      {rec.is_override ? (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {t('fpo_grading_officer_override', 'Officer Override')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {t('fpo_grading_ai_verified', 'AI Verified')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(rec.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setShowDetailModal(true);
                        }}
                        className="text-xs text-primary-700 font-semibold hover:text-primary-800 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <FiEye className="w-3.5 h-3.5" /> {t('common_details', 'Details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`${t('fpo_grading_record', 'Grading Record')} #${selectedRecord.id} — ${selectedRecord.produce_type}`}
        >
          <div className="space-y-4">
            {selectedRecord.image_url && (
              <div className="bg-gray-100 rounded-xl p-2 max-h-60 overflow-hidden flex items-center justify-center">
                <img
                  src={selectedRecord.image_url}
                  alt="Inspection sample"
                  className="max-h-56 object-contain rounded-lg shadow-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl">
              <div>
                <span className="text-gray-500 block">{t('common_produce', 'Produce:')}</span>
                <span className="font-bold text-gray-900">{selectedRecord.produce_type}</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t('fpo_grading_lot_identifier', 'Lot Identifier:')}</span>
                <span className="font-mono font-bold text-gray-900">{selectedRecord.lot_id || t('fpo_grading_standalone', 'Standalone')}</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t('fpo_grading_ai_initial_grade', 'AI Initial Grade:')}</span>
                <span className="font-bold text-gray-900">{t('common_grade', 'Grade')} {selectedRecord.ai_grade}</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t('fpo_grading_final_assigned_grade', 'Final Assigned Grade:')}</span>
                <span className="font-bold text-primary-700">{t('common_grade', 'Grade')} {selectedRecord.final_grade}</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t('common_confidence_label', 'Confidence:')}</span>
                <span className="font-bold text-gray-900">{Math.round((selectedRecord.confidence_score || 0) * 100)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t('fpo_grading_graded_by', 'Graded By:')}</span>
                <span className="font-bold text-gray-900">{selectedRecord.graded_by || 'FPO Officer'}</span>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700 mb-1">{t('fpo_grading_observations', 'Observations & Notes:')}</p>
              <p className="text-xs text-gray-800 leading-relaxed">
                {selectedRecord.observations || t('fpo_grading_no_observations', 'No additional observations recorded.')}
              </p>
              {selectedRecord.override_reason && (
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  {t('fpo_grading_override_reason_label', 'Override Reason:')} {selectedRecord.override_reason}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              {t('common_close', 'Close')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
