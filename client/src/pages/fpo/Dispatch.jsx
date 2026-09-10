import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import {
  FiTruck, FiPhone, FiMapPin, FiNavigation, FiClock, FiPlus,
  FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiInfo, FiCheck,
  FiTrendingUp, FiLayers, FiCompass
} from 'react-icons/fi';

// Custom Map Markers using L.divIcon
const createDivIcon = (emoji, bgColor) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color:${bgColor};color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 3px 8px rgba(0,0,0,0.35);border:2.5px solid white;">${emoji}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

const truckIcon = createDivIcon('🚚', '#16a34a');
const warehouseIcon = createDivIcon('🏢', '#1e3a8a');
const destIcon = createDivIcon('📍', '#dc2626');

// Helper to pan map dynamically
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 11, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function Dispatch() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeMapData, setActiveMapData] = useState({
    warehouse: { name: 'Kisaan Sahyog FPO Central Hub', lat: 18.5204, lng: 73.8567 },
    trucks: []
  });
  const [dispatches, setDispatches] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Truck for Details Panel
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.7, 73.5]);
  const [mapZoom, setMapZoom] = useState(9);

  // Create Dispatch Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderProgress, setOrderProgress] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    order_id: '',
    vehicle_number: '',
    driver_name: '',
    driver_phone: '',
    quantity_kg: '',
    origin_address: 'Kisaan Sahyog FPO Central Warehouse, Pune',
    destination_address: 'APMC Market Vashi, Navi Mumbai',
    dest_lat: 19.076,
    dest_lng: 72.8777,
    expected_arrival: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto-refresh interval for real-time tracking
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadMapData(false);
    }, 10000); // Poll GPS every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadMapData(true), loadDispatches(), loadConfirmedOrders()]);
    setLoading(false);
  };

  const loadMapData = async (isFirst = false) => {
    try {
      const res = await axios.get('/api/dispatches/active-map');
      setActiveMapData(res.data);
      if (isFirst && res.data.trucks?.length > 0) {
        setSelectedTruck(res.data.trucks[0]);
        setMapCenter([res.data.trucks[0].current_lat, res.data.trucks[0].current_lng]);
      } else if (selectedTruck) {
        // Refresh selected truck data
        const updated = res.data.trucks.find(t => t.id === selectedTruck.id);
        if (updated) setSelectedTruck(updated);
      }
    } catch (err) {
      console.error('Failed to load active map data:', err);
    }
  };

  const loadDispatches = async () => {
    try {
      const res = await axios.get('/api/dispatches');
      setDispatches(res.data.dispatches || []);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    }
  };

  const loadConfirmedOrders = async () => {
    try {
      const res = await axios.get(`/api/orders?fpo_id=${user?.fpo_id || 1}&status=confirmed`);
      setConfirmedOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  // Order selection for dispatch creation with overflow checking
  const handleOrderSelect = async (orderId) => {
    setDispatchForm(f => ({ ...f, order_id: orderId }));
    if (!orderId) {
      setOrderProgress(null);
      return;
    }
    try {
      const res = await axios.get(`/api/dispatches/order-progress/${orderId}`);
      setOrderProgress(res.data);
      setDispatchForm(f => ({
        ...f,
        order_id: orderId,
        quantity_kg: res.data.remaining_to_dispatch_kg > 0 ? res.data.remaining_to_dispatch_kg : '',
        destination_address: `${res.data.buyer_name}, ${res.data.buyer_location || 'APMC Market'}`
      }));
    } catch {
      toast.error(t('common_error', 'Failed to load order progress details'));
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    if (orderProgress && parseFloat(dispatchForm.quantity_kg) > orderProgress.remaining_to_dispatch_kg) {
      toast.error(`${t('fpo_disp_cannot_dispatch_more', 'Cannot dispatch more than remaining order')} (${orderProgress.remaining_to_dispatch_kg} kg)`);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/dispatches', {
        ...dispatchForm,
        fpo_id: user?.fpo_id || 1,
        quantity_kg: parseFloat(dispatchForm.quantity_kg)
      });
      toast.success(t('common_success', 'Dispatch created and driver GPS route activated!'));
      setShowCreateModal(false);
      setOrderProgress(null);
      setDispatchForm({
        order_id: '',
        vehicle_number: '',
        driver_name: '',
        driver_phone: '',
        quantity_kg: '',
        origin_address: 'Kisaan Sahyog FPO Central Warehouse, Pune',
        destination_address: 'APMC Market Vashi, Navi Mumbai',
        dest_lat: 19.076,
        dest_lng: 72.8777,
        expected_arrival: ''
      });
      loadAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common_error', 'Failed to create dispatch'));
    } finally {
      setSubmitting(false);
    }
  };

  const recenterOnTruck = (truck) => {
    setSelectedTruck(truck);
    setMapCenter([truck.current_lat, truck.current_lng]);
    setMapZoom(12);
  };

  const activeCount = activeMapData.trucks.length;
  const inTransitCount = activeMapData.trucks.filter(t => t.status === 'in_transit').length;
  const totalInTransitQty = activeMapData.trucks.reduce((s, t) => s + (t.quantity_kg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🚚</span> {t('fpo_disp_title', 'Live Multi-Truck GPS Dispatch & Tracking')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('fpo_disp_subtitle', 'Real-time interactive OpenStreetMap tracking with authentic device GPS telemetry, route vectors, and driver communication')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMapData(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('fpo_disp_refresh_gps', 'Refresh GPS')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            {t('fpo_disp_new', 'New Dispatch')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t('fpo_disp_active_fleet', 'Active Fleet')}</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{activeCount} {t('common_vehicles', 'Vehicles')}</span>
          <span className="text-xs text-primary-700 font-medium">{t('fpo_disp_equipped_gps', 'Equipped with GPS')}</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t('fpo_disp_in_transit', 'In Transit')}</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{inTransitCount} {t('fpo_disp_en_route', 'En Route')}</span>
          <span className="text-xs text-blue-600 font-medium">{t('fpo_disp_broadcasting', 'Broadcasting telemetry')}</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t('fpo_disp_cargo_en_route', 'Cargo En Route')}</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{totalInTransitQty.toLocaleString()} kg</span>
          <span className="text-xs text-emerald-600 font-medium">{t('fpo_disp_high_grade', 'High-grade produce')}</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{t('fpo_disp_completed_today', 'Completed Today')}</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">
            {dispatches.filter(d => d.status === 'delivered').length} {t('fpo_disp_delivered', 'Delivered')}
          </span>
          <span className="text-xs text-purple-600 font-medium">{t('fpo_disp_on_time', '100% on-time delivery')}</span>
        </div>
      </div>

      {/* Main Map & Interactive Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Map (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-base font-bold text-gray-900">{t('fpo_disp_live_map', 'Live Highway Operations Map')}</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-800"></span> {t('fpo_disp_fpo_hub', 'FPO Hub')}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-600"></span> {t('fpo_disp_truck', 'Truck')}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> {t('fpo_disp_buyer_mandi', 'Buyer Mandi')}</span>
            </div>
          </div>

          {/* Leaflet OpenStreetMap Container */}
          <div className="h-[480px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-10">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <ChangeMapView center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Warehouse Marker */}
              {activeMapData.warehouse && (
                <Marker
                  position={[activeMapData.warehouse.lat, activeMapData.warehouse.lng]}
                  icon={warehouseIcon}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-blue-900">{activeMapData.warehouse.name}</p>
                      <p className="text-gray-500">{t('fpo_disp_hub_desc', 'Central Logistics & Aggregation Hub')}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Active Trucks Markers & Routes */}
              {activeMapData.trucks.map((tItem) => {
                const truckPos = [tItem.current_lat, tItem.current_lng];
                const originPos = [activeMapData.warehouse.lat, activeMapData.warehouse.lng];
                const destPos = [tItem.dest_lat, tItem.dest_lng];

                return (
                  <div key={tItem.id}>
                    {/* Destination Marker */}
                    <Marker position={destPos} icon={destIcon}>
                      <Popup>
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-red-900">{tItem.buyer_name || 'Buyer APMC'}</p>
                          <p className="text-gray-600">{tItem.destination_address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Truck Marker */}
                    <Marker
                      position={truckPos}
                      icon={truckIcon}
                      eventHandlers={{
                        click: () => recenterOnTruck(tItem)
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1.5 p-1">
                          <p className="font-bold text-primary-800 text-sm">{tItem.vehicle_number}</p>
                          <p className="text-gray-700 font-semibold">{tItem.dispatch_id} · {tItem.quantity_kg} kg</p>
                          <p className="text-gray-600">{t('common_driver', 'Driver:')} {tItem.driver_name} ({tItem.driver_phone})</p>
                          <p className="text-emerald-700 font-medium">ETA: {tItem.eta}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Polyline connecting Origin -> Truck -> Destination */}
                    <Polyline
                      positions={[originPos, truckPos, destPos]}
                      color="#16a34a"
                      weight={4}
                      opacity={0.7}
                      dashArray="6, 8"
                    />
                  </div>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Right Sidebar: Truck List & Selected Truck Details (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Dispatches List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">{t('fpo_disp_active_trucks', 'Active Trucks Fleet')}</h3>
              <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {activeMapData.trucks.length} {t('fpo_disp_live', 'live')}
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {activeMapData.trucks.map((truck) => {
                const isSelected = selectedTruck?.id === truck.id;
                return (
                  <div
                    key={truck.id}
                    onClick={() => recenterOnTruck(truck)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 shadow-sm ring-1 ring-primary-400'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <FiTruck className="text-primary-600" />
                        {truck.vehicle_number}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {truck.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{truck.driver_name}</span>
                      <span className="font-semibold text-gray-800">{truck.quantity_kg?.toLocaleString()} kg</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-100">
                      <span className="text-emerald-700 font-semibold">ETA: {truck.eta}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          recenterOnTruck(truck);
                        }}
                        className="text-primary-700 hover:underline font-bold flex items-center gap-1"
                      >
                        <FiNavigation className="w-3 h-3" /> {t('fpo_disp_recenter', 'Re-center')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Truck Details Panel */}
          {selectedTruck && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedTruck.vehicle_number}</h3>
                  <p className="text-xs font-mono text-primary-700">{selectedTruck.dispatch_id}</p>
                </div>
                <a
                  href={`tel:${selectedTruck.driver_phone}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <FiPhone className="w-3.5 h-3.5" /> {t('fpo_disp_call_driver', 'Call Driver')}
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-gray-500 block">{t('common_driver', 'Driver:')}</span>
                  <span className="font-bold text-gray-900">{selectedTruck.driver_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('common_phone', 'Phone:')}</span>
                  <span className="font-bold text-gray-900">{selectedTruck.driver_phone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('fpo_disp_current_speed', 'Current Speed:')}</span>
                  <span className="font-bold text-gray-900">{selectedTruck.speed || 48} km/h</span>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('fpo_disp_eta', 'Estimated Arrival:')}</span>
                  <span className="font-bold text-emerald-700">{selectedTruck.eta}</span>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('fpo_disp_destination_label', 'Destination:')}</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[170px]">
                    {selectedTruck.destination_address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('fpo_disp_payload_label', 'Cargo Payload:')}</span>
                  <span className="font-bold text-gray-900">{selectedTruck.quantity_kg?.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('fpo_disp_last_gps', 'Last GPS Fix:')}</span>
                  <span className="text-gray-700">
                    {selectedTruck.last_location_update
                      ? new Date(selectedTruck.last_location_update).toLocaleTimeString()
                      : t('fpo_disp_live_status', 'Live')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => recenterOnTruck(selectedTruck)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <FiCompass className="w-4 h-4 text-primary-600" /> {t('fpo_disp_focus_vehicle', 'Focus on Vehicle')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Dispatch History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <FiClock className="text-primary-600" /> {t('fpo_disp_history_chain', 'Dispatch History & Traceability Chain')}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-y">
              <tr>
                <th className="py-3 px-4">{t('common_dispatch_id', 'Dispatch ID')}</th>
                <th className="py-3 px-4">{t('common_order_id', 'Order ID')}</th>
                <th className="py-3 px-4">{t('common_vehicle', 'Vehicle')}</th>
                <th className="py-3 px-4">{t('common_driver_header', 'Driver')}</th>
                <th className="py-3 px-4">{t('common_quantity', 'Quantity')}</th>
                <th className="py-3 px-4">{t('common_destination', 'Destination')}</th>
                <th className="py-3 px-4">{t('common_status', 'Status')}</th>
                <th className="py-3 px-4">{t('fpo_disp_time', 'Dispatch Time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dispatches.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-primary-700 text-xs">{d.dispatch_id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">{d.order_id || '—'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{d.vehicle_number}</td>
                  <td className="py-3 px-4 text-gray-700">{d.driver_name}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{d.quantity_kg?.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">{d.destination_address}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        d.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {d.dispatch_time ? new Date(d.dispatch_time).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Dispatch Modal with Order Progress & Overflow Check */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={t('fpo_disp_create_dispatch', 'Create New Produce Dispatch')}
        >
          <form onSubmit={handleCreateDispatch} className="space-y-4">
            {/* Select Confirmed Buyer Order */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('fpo_disp_select_order', 'Select Confirmed Buyer Order')}
              </label>
              <select
                value={dispatchForm.order_id}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">{t('fpo_disp_choose_order', '-- Choose Order --')}</option>
                {confirmedOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_id} · {o.buyer_name || 'Buyer'} ({o.quantity_kg} kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Order Progress Breakdown Bar */}
            {orderProgress && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-blue-950">
                  <span>{t('fpo_disp_buyer_label', 'Buyer:')} {orderProgress.buyer_name}</span>
                  <span>{t('fpo_disp_order_total', 'Order Total:')} {orderProgress.order_total_kg.toLocaleString()} kg</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block text-[10px]">{t('fpo_disp_dispatched_label', 'Dispatched')}</span>
                    <span className="font-bold text-blue-700">{orderProgress.dispatched_kg} kg</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block text-[10px]">{t('fpo_disp_delivered_label', 'Delivered')}</span>
                    <span className="font-bold text-emerald-700">{orderProgress.delivered_kg} kg</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block text-[10px]">{t('fpo_disp_remaining_label', 'Remaining')}</span>
                    <span className="font-bold text-purple-700">{orderProgress.remaining_to_dispatch_kg} kg</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Number & Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('fpo_disp_vehicle_plate', 'Vehicle Plate')}</label>
                <input
                  type="text"
                  placeholder="MH 12 AB 9021"
                  value={dispatchForm.vehicle_number}
                  onChange={(e) => setDispatchForm(f => ({ ...f, vehicle_number: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('fpo_disp_driver_name', 'Driver Name')}</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  value={dispatchForm.driver_name}
                  onChange={(e) => setDispatchForm(f => ({ ...f, driver_name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            {/* Driver Phone & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('fpo_disp_driver_phone', 'Driver Phone')}</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={dispatchForm.driver_phone}
                  onChange={(e) => setDispatchForm(f => ({ ...f, driver_phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('fpo_disp_qty_kg', 'Dispatch Qty (kg)')}</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={dispatchForm.quantity_kg}
                  onChange={(e) => setDispatchForm(f => ({ ...f, quantity_kg: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                  required
                />
              </div>
            </div>

            {/* Overflow warning */}
            {orderProgress && parseFloat(dispatchForm.quantity_kg) > orderProgress.remaining_to_dispatch_kg && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <FiAlertTriangle /> {t('fpo_disp_cannot_dispatch_more', 'Cannot dispatch more than remaining order')} ({orderProgress.remaining_to_dispatch_kg} kg)
              </p>
            )}

            {/* Destination Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('fpo_disp_dest_address', 'Destination Address')}</label>
              <input
                type="text"
                value={dispatchForm.destination_address}
                onChange={(e) => setDispatchForm(f => ({ ...f, destination_address: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Form actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50"
              >
                {t('common_cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  !dispatchForm.vehicle_number ||
                  !dispatchForm.driver_name ||
                  (orderProgress && parseFloat(dispatchForm.quantity_kg) > orderProgress.remaining_to_dispatch_kg)
                }
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? t('fpo_disp_creating', 'Creating...') : t('fpo_disp_activate_tracking', 'Activate Dispatch & Tracking')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
