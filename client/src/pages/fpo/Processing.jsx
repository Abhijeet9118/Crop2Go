import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import {
  FiSettings, FiBox, FiTrendingDown, FiCheckCircle, FiAlertCircle,
  FiPlus, FiRefreshCw, FiLayers, FiShield, FiActivity
} from 'react-icons/fi';

export default function Processing() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_produce_kg: 0,
    total_processed_kg: 0,
    total_remaining_kg: 0,
    cold_storage_kg: 0,
    processing_unit_kg: 0,
    packaging_kg: 0,
    batches: []
  });
  const [allocations, setAllocations] = useState([]);

  // Allocation Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [destination, setDestination] = useState('processing_unit');
  const [allocQuantity, setAllocQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, allocRes] = await Promise.all([
        axios.get('/api/processing/summary'),
        axios.get('/api/processing/allocations')
      ]);
      setSummary(sumRes.data);
      setAllocations(allocRes.data.allocations || []);
    } catch (err) {
      console.error('Failed to load processing data:', err);
      toast.error(t('common_failed', 'Failed to load processing batches'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAllocateModal = (batch) => {
    setSelectedBatch(batch);
    setAllocQuantity('');
    setNotes('');
    setDestination('processing_unit');
    setShowModal(true);
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const qty = parseFloat(allocQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('common_error', 'Please enter a valid positive quantity'));
      return;
    }

    if (qty > selectedBatch.remaining_kg) {
      toast.error(`${t('fpo_proc_cannot_allocate_more', 'Cannot allocate more than remaining produce')} (${selectedBatch.remaining_kg.toLocaleString()} ${t('common_kg', 'kg')} ${t('fpo_proc_remaining', 'remaining')})`);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/processing/allocate', {
        batch_id: selectedBatch.batch_id,
        destination,
        quantity_kg: qty,
        notes,
        allocated_by: user?.name || 'FPO Officer'
      });

      toast.success(t('common_success', 'Successfully allocated'));
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common_failed', 'Allocation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Progress Bar percentages
  const total = summary.total_produce_kg || 1;
  const coldPct = Math.round((summary.cold_storage_kg / total) * 100);
  const procPct = Math.round((summary.processing_unit_kg / total) * 100);
  const packPct = Math.round((summary.packaging_kg / total) * 100);
  const remPct = Math.max(0, 100 - coldPct - procPct - packPct);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏭</span> {t('fpo_proc_title', 'FPO Processing & Inventory Allocation')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('fpo_proc_subtitle', 'Dynamic tracking of incoming produce, multi-channel allocation, and strict batch overflow prevention')}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('common_refresh_data', 'Refresh Data')}
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            {t('fpo_proc_total_received', 'Total Produce Received')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">
              {summary.total_produce_kg.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-gray-500">{t('common_kg', 'kg')}</span>
          </div>
          <p className="text-xs text-primary-700 mt-2 font-medium">{t('fpo_proc_verified_intake', '100% verified intake from FPO lots')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            {t('fpo_proc_total_processed', 'Total Processed / Allocated')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {summary.total_processed_kg.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-gray-500">{t('common_kg', 'kg')}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {(Math.round((summary.total_processed_kg / (summary.total_produce_kg || 1)) * 100))}% {t('fpo_proc_allocated_to_units', 'allocated to units')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            {t('fpo_proc_remaining_produce', 'Remaining Available Produce')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {summary.total_remaining_kg.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-emerald-800">{t('common_kg', 'kg')}</span>
          </div>
          <p className="text-xs text-emerald-700 mt-2 font-mono">
            {t('fpo_proc_formula', 'Formula:')} {summary.total_produce_kg.toLocaleString()} - {summary.total_processed_kg.toLocaleString()} = {summary.total_remaining_kg.toLocaleString()} {t('common_kg', 'kg')}
          </p>
        </div>
      </div>

      {/* Segmented Produce Progress & Utilization Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">{t('fpo_proc_utilization_breakdown', 'Produce Utilization Breakdown')}</h2>
            <p className="text-xs text-gray-500">{t('fpo_proc_active_distribution', 'Active distribution of aggregate produce across storage and processing channels')}</p>
          </div>
          <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            {t('common_total', 'Total:')} {summary.total_produce_kg.toLocaleString()} {t('common_kg', 'kg')}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-gray-100 h-6 rounded-xl overflow-hidden flex shadow-inner border border-gray-200">
          {coldPct > 0 && (
            <div
              style={{ width: `${coldPct}%` }}
              className="bg-blue-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all"
              title={`${t('fpo_proc_cold_storage_label', 'Cold Storage:')} ${summary.cold_storage_kg} kg (${coldPct}%)`}
            >
              {coldPct >= 10 ? `${coldPct}%` : ''}
            </div>
          )}
          {procPct > 0 && (
            <div
              style={{ width: `${procPct}%` }}
              className="bg-amber-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all"
              title={`${t('fpo_proc_processing_unit_label', 'Processing Unit:')} ${summary.processing_unit_kg} kg (${procPct}%)`}
            >
              {procPct >= 10 ? `${procPct}%` : ''}
            </div>
          )}
          {packPct > 0 && (
            <div
              style={{ width: `${packPct}%` }}
              className="bg-purple-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all"
              title={`${t('fpo_proc_packaging_label', 'Packaging:')} ${summary.packaging_kg} kg (${packPct}%)`}
            >
              {packPct >= 10 ? `${packPct}%` : ''}
            </div>
          )}
          {remPct > 0 && (
            <div
              style={{ width: `${remPct}%` }}
              className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all"
              title={`${t('fpo_proc_remaining_label', 'Remaining:')} ${summary.total_remaining_kg} kg (${remPct}%)`}
            >
              {remPct >= 10 ? `${t('fpo_proc_remaining', 'Remaining')} ${remPct}%` : ''}
            </div>
          )}
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-xs font-semibold text-blue-900">{t('fpo_proc_cold_storage', 'Cold Storage')}</span>
            </div>
            <p className="text-lg font-bold text-blue-800">{summary.cold_storage_kg.toLocaleString()} {t('common_kg', 'kg')}</p>
            <p className="text-[11px] text-blue-600">{coldPct}{t('fpo_proc_pct_of_total', '% of total')}</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded bg-amber-500"></span>
              <span className="text-xs font-semibold text-amber-900">{t('fpo_proc_processing_unit', 'Processing Unit')}</span>
            </div>
            <p className="text-lg font-bold text-amber-800">{summary.processing_unit_kg.toLocaleString()} {t('common_kg', 'kg')}</p>
            <p className="text-[11px] text-amber-600">{procPct}{t('fpo_proc_pct_of_total', '% of total')}</p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded bg-purple-500"></span>
              <span className="text-xs font-semibold text-purple-900">{t('fpo_proc_packaging', 'Packaging')}</span>
            </div>
            <p className="text-lg font-bold text-purple-800">{summary.packaging_kg.toLocaleString()} {t('common_kg', 'kg')}</p>
            <p className="text-[11px] text-purple-600">{packPct}{t('fpo_proc_pct_of_total', '% of total')}</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="text-xs font-semibold text-emerald-900">{t('fpo_proc_remaining_available', 'Remaining Available')}</span>
            </div>
            <p className="text-lg font-bold text-emerald-800">{summary.total_remaining_kg.toLocaleString()} {t('common_kg', 'kg')}</p>
            <p className="text-[11px] text-emerald-600">{remPct}{t('fpo_proc_pct_unallocated', '% unallocated')}</p>
          </div>
        </div>
      </div>

      {/* Batch-wise Tracking & Allocation Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FiLayers className="text-primary-600" /> {t('fpo_proc_batch_tracking', 'Batch-wise Tracking & Allocation')}
            </h2>
            <p className="text-xs text-gray-500">{t('fpo_proc_batch_subtitle', 'Select an incoming batch to allocate quantity to processing, packaging, or cold storage')}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-y">
              <tr>
                <th className="py-3 px-4">{t('common_batch_id', 'Batch ID')}</th>
                <th className="py-3 px-4">{t('common_crop', 'Crop')}</th>
                <th className="py-3 px-4">{t('fpo_proc_initial_intake', 'Initial Intake')}</th>
                <th className="py-3 px-4">{t('fpo_proc_allocated_processed', 'Allocated / Processed')}</th>
                <th className="py-3 px-4">{t('fpo_proc_remaining_available', 'Remaining Available')}</th>
                <th className="py-3 px-4">{t('common_status', 'Status')}</th>
                <th className="py-3 px-4 text-right">{t('common_action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.batches.map((b) => {
                const bRemPct = Math.round((b.remaining_kg / (b.total_quantity_kg || 1)) * 100);
                return (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-700">
                      {b.batch_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {b.crop_type}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {b.total_quantity_kg.toLocaleString()} {t('common_kg', 'kg')}
                    </td>
                    <td className="py-3.5 px-4 text-blue-600 font-semibold">
                      {b.processed_kg.toLocaleString()} {t('common_kg', 'kg')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      <div>{b.remaining_kg.toLocaleString()} {t('common_kg', 'kg')}</div>
                      <div className="w-20 bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${bRemPct}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.remaining_kg <= 0 ? (
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {t('fpo_proc_fully_allocated', 'Fully Allocated')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {t('fpo_proc_available', 'Available')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openAllocateModal(b)}
                        disabled={b.remaining_kg <= 0}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm inline-flex items-center gap-1"
                      >
                        <FiPlus className="w-3.5 h-3.5" /> {t('fpo_proc_allocate', 'Allocate')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FiActivity className="text-primary-600" /> {t('fpo_proc_history_log', 'Allocation History Log')}
          </h2>
          <p className="text-xs text-gray-500">{t('fpo_proc_audit_trail', 'Audit trail of all previous produce transfers')}</p>
        </div>

        {allocations.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">{t('fpo_proc_no_allocations', 'No allocations recorded yet.')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-y">
                <tr>
                  <th className="py-2.5 px-4">{t('common_batch_id', 'Batch ID')}</th>
                  <th className="py-2.5 px-4">{t('common_destination', 'Destination')}</th>
                  <th className="py-2.5 px-4">{t('common_quantity', 'Quantity')}</th>
                  <th className="py-2.5 px-4">{t('common_notes', 'Notes')}</th>
                  <th className="py-2.5 px-4">{t('common_officer', 'Officer')}</th>
                  <th className="py-2.5 px-4">{t('common_timestamp', 'Timestamp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold text-primary-700">{a.batch_id}</td>
                    <td className="py-2.5 px-4 capitalize font-medium text-gray-800">{a.destination.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{a.quantity_kg.toLocaleString()} {t('common_kg', 'kg')}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{a.notes || '—'}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-600">{a.allocated_by}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">
                      {new Date(a.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocation Modal with Strict Overflow Protection */}
      {selectedBatch && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${t('fpo_proc_allocate_produce_from', 'Allocate Produce from')} ${selectedBatch.batch_id} (${selectedBatch.crop_type})`}
        >
          <form onSubmit={handleAllocate} className="space-y-4">
            {/* Batch Status Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between font-medium text-emerald-900">
                <span>{t('fpo_proc_total_batch_intake', 'Total Batch Intake:')}</span>
                <span className="font-bold">{selectedBatch.total_quantity_kg.toLocaleString()} {t('common_kg', 'kg')}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800 text-sm pt-1 border-t border-emerald-200">
                <span>{t('fpo_proc_remaining_available', 'Remaining Available:')}</span>
                <span className="font-mono">{selectedBatch.remaining_kg.toLocaleString()} {t('common_kg', 'kg')}</span>
              </div>
            </div>

            {/* Destination Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('fpo_proc_select_destination', 'Select Destination Unit')}
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="processing_unit">{t('fpo_proc_processing_unit_desc', 'Processing Unit (Puree / Paste / Starch)')}</option>
                <option value="cold_storage">{t('fpo_proc_cold_storage_desc', 'Cold Storage (Controlled Temperature)')}</option>
                <option value="packaging">{t('fpo_proc_packaging_desc', 'Packaging & Retail Dispatch')}</option>
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  {t('fpo_proc_qty_to_allocate', 'Quantity to Allocate (kg)')}
                </label>
                <span className="text-xs text-gray-500">{t('common_max', 'Max:')} {selectedBatch.remaining_kg} {t('common_kg', 'kg')}</span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max={selectedBatch.remaining_kg}
                value={allocQuantity}
                onChange={(e) => setAllocQuantity(e.target.value)}
                placeholder={`${t('fpo_proc_enter_kg', 'Enter kg (1 to')} ${selectedBatch.remaining_kg})`}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-base font-bold outline-none ${
                  parseFloat(allocQuantity) > selectedBatch.remaining_kg
                    ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-primary-500'
                }`}
                required
              />
              {parseFloat(allocQuantity) > selectedBatch.remaining_kg && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5" />
                  {t('fpo_proc_cannot_allocate_more', 'Cannot allocate more than remaining produce')} ({selectedBatch.remaining_kg} {t('common_kg', 'kg')} {t('fpo_proc_remaining', 'remaining')})
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('fpo_proc_notes_optional', 'Notes / Line Reference (Optional)')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('fpo_proc_notes_placeholder', 'e.g. Line 2 secondary pulp conversion')}
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-colors"
              >
                {t('common_cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  !allocQuantity ||
                  parseFloat(allocQuantity) <= 0 ||
                  parseFloat(allocQuantity) > selectedBatch.remaining_kg
                }
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('fpo_proc_allocating', 'Allocating...') : t('fpo_proc_confirm_allocation', 'Confirm Allocation')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
