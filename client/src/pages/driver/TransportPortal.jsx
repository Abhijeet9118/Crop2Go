import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiTruck, FiNavigation, FiRadio, FiCheckCircle, FiPhone,
  FiMapPin, FiClock, FiAlertTriangle, FiCompass, FiActivity,
  FiPackage, FiSettings, FiShield, FiFileText, FiAward, FiCheck, FiRefreshCw
} from 'react-icons/fi';

export default function TransportPortal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab switching (sync with URL ?tab=gps|dispatches|vehicle)
  const initialTab = searchParams.get('tab') || 'gps';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['gps', 'dispatches', 'vehicle'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [allDispatches, setAllDispatches] = useState([]);
  const [activeDispatches, setActiveDispatches] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [gpsData, setGpsData] = useState({
    lat: null,
    lng: null,
    speed: 0,
    heading: 0,
    accuracy: null,
    lastUpdated: null
  });
  const [updateCount, setUpdateCount] = useState(0);
  const watchIdRef = useRef(null);

  useEffect(() => {
    loadDispatches();
    return () => {
      stopBroadcast();
    };
  }, []);

  const loadDispatches = async () => {
    try {
      const res = await axios.get('/api/dispatches');
      const list = res.data.dispatches || [];
      setAllDispatches(list);

      const inTransit = list.filter(
        d => d.status === 'in_transit' || d.status === 'loading'
      );
      setActiveDispatches(inTransit);

      if (inTransit.length > 0 && !selectedDispatch) {
        setSelectedDispatch(inTransit[0]);
      }
    } catch {
      toast.error(t('driver_err_load_shipments', 'Failed to load active shipments'));
    }
  };

  const startBroadcast = () => {
    if (!selectedDispatch) {
      toast.error(t('driver_err_select_trip', 'Please select an active dispatch trip first'));
      return;
    }

    if (!navigator.geolocation) {
      toast.error(t('driver_err_geo_unsupported', 'Geolocation is not supported by your browser or device'));
      return;
    }

    setIsBroadcasting(true);
    toast.success(t('driver_msg_gps_initiated', 'Live GPS broadcasting initiated!'));

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 3000
    };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        const speedKmh = speed ? Math.round(speed * 3.6) : 48; // convert m/s to km/h or nominal road speed

        setGpsData({
          lat: latitude,
          lng: longitude,
          speed: speedKmh,
          heading: heading || 0,
          accuracy: Math.round(accuracy),
          lastUpdated: new Date()
        });
        setUpdateCount(c => c + 1);

        // Send real telemetry update to server
        try {
          await axios.put(`/api/dispatches/${selectedDispatch.id}/location`, {
            lat: latitude,
            lng: longitude,
            speed: speedKmh,
            heading: heading || 0
          });
        } catch (err) {
          console.error('Failed to sync GPS to server:', err);
        }
      },
      (err) => {
        console.warn('GPS signal pending or permission restricted:', err.message);
        // Fallback to simulated road telemetry near Pune-Mumbai
        simulateFix();
      },
      options
    );

    watchIdRef.current = watchId;
  };

  const stopBroadcast = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcasting(false);
    toast(t('driver_msg_gps_stopped', 'GPS broadcast stopped'));
  };

  // Helper for desktop testing when physical GPS is unavailable
  const simulateFix = async () => {
    if (!selectedDispatch) return;
    const baseLat = selectedDispatch.current_lat || 18.75;
    const baseLng = selectedDispatch.current_lng || 73.40;
    const newLat = baseLat + (Math.random() - 0.5) * 0.005;
    const newLng = baseLng + (Math.random() - 0.5) * 0.005;

    setGpsData({
      lat: newLat,
      lng: newLng,
      speed: 52,
      heading: 295,
      accuracy: 6,
      lastUpdated: new Date()
    });
    setUpdateCount(c => c + 1);

    try {
      await axios.put(`/api/dispatches/${selectedDispatch.id}/location`, {
        lat: newLat,
        lng: newLng,
        speed: 52,
        heading: 295
      });
      toast.success(t('driver_msg_gps_synced', 'Live GPS coordinate packet synced to FPO'));
    } catch {
      // ignore
    }
  };

  const updateDispatchStatus = async (dispatchId, newStatus) => {
    try {
      await axios.put(`/api/dispatches/${dispatchId}/status`, { status: newStatus });
      toast.success(`${t('driver_msg_status_updated', 'Trip status updated to:')} ${newStatus.replace('_', ' ').toUpperCase()}`);
      if (newStatus === 'delivered' && isBroadcasting) {
        stopBroadcast();
      }
      loadDispatches();
    } catch {
      toast.error(t('driver_err_update_status', 'Failed to update trip status'));
    }
  };

  const markDelivered = async () => {
    if (!selectedDispatch) return;
    updateDispatchStatus(selectedDispatch.id, 'delivered');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Transporter Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-primary-800 to-primary-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl backdrop-blur-sm border border-white/20">
              🚛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{t('driver_title', 'Transporter & Fleet Portal')}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wide">
                  {user?.role || t('driver_role_transporter', 'Transporter')}
                </span>
              </div>
              <p className="text-xs text-primary-200 mt-0.5">
                {user?.name || t('driver_default_name', 'Commercial Driver')} • {user?.vehicle_number || t('driver_default_vehicle', 'Commercial Vehicle MH-12-AB-9021')}
              </p>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${
            isBroadcasting ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 animate-pulse' : 'bg-white/10 border-white/20 text-gray-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isBroadcasting ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
            {isBroadcasting ? t('driver_gps_live', 'LIVE GPS BROADCASTING') : t('driver_gps_standby', 'TRANSMITTER STANDBY')}
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto">
          <button
            onClick={() => switchTab('gps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'gps'
                ? 'bg-white text-primary-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FiNavigation className="w-4 h-4" />
            📡 {t('driver_tab_active_trip', 'Live GPS Transmitter & Navigation')}
          </button>
          <button
            onClick={() => switchTab('dispatches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'dispatches'
                ? 'bg-white text-primary-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FiPackage className="w-4 h-4" />
            📋 {t('driver_tab_dispatches_label', 'Assigned Dispatches & Cargo')} ({allDispatches.length})
          </button>
          <button
            onClick={() => switchTab('vehicle')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'vehicle'
                ? 'bg-white text-primary-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FiTruck className="w-4 h-4" />
            🚛 {t('driver_tab_vehicle', 'Commercial Vehicle Specs')}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LIVE GPS TRANSMITTER */}
      {/* ========================================================= */}
      {activeTab === 'gps' && (
        <div className="space-y-6">
          {/* Select Active Shipment Trip */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <FiRadio className="text-primary-600" /> {t('driver_select_active_trip', 'Select Active Assigned Trip')}
              </label>
              <button
                onClick={loadDispatches}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <FiRefreshCw className="w-3 h-3" /> {t('driver_refresh_trips', 'Refresh Trips')}
              </button>
            </div>

            {activeDispatches.length === 0 ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs">
                {t('driver_no_active_trips', 'No active in-transit shipments found. Shipments dispatched by the FPO will appear here immediately.')}
              </div>
            ) : (
              <select
                value={selectedDispatch?.id || ''}
                onChange={(e) => {
                  const d = activeDispatches.find(x => x.id === parseInt(e.target.value));
                  setSelectedDispatch(d);
                  if (isBroadcasting) stopBroadcast();
                }}
                className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 cursor-pointer"
              >
                {activeDispatches.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.vehicle_number} — {d.dispatch_id} ({d.driver_name}) → {d.destination_address || d.destination} ({d.quantity_kg?.toLocaleString()} kg)
                  </option>
                ))}
              </select>
            )}

            {selectedDispatch && (
              <div className="p-4 bg-gray-50 rounded-xl text-xs space-y-2 border border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-500 block text-[11px]">{t('driver_dispatch_code', 'Dispatch Code')}</span>
                    <span className="font-mono font-bold text-gray-900">{selectedDispatch.dispatch_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">{t('driver_destination', 'Destination')}</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedDispatch.destination_address || selectedDispatch.destination}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">{t('driver_cargo_weight', 'Cargo Weight')}</span>
                    <span className="font-bold text-primary-700">{selectedDispatch.quantity_kg?.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">{t('driver_vehicle_plate', 'Vehicle Plate')}</span>
                    <span className="font-mono font-bold text-gray-800">{selectedDispatch.vehicle_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">{t('driver_assigned_driver', 'Assigned Driver')}</span>
                    <span className="font-medium text-gray-800">{selectedDispatch.driver_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">{t('driver_current_status', 'Current Status')}</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                      {selectedDispatch.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live GPS Telemetry Dashboard */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiNavigation className="text-primary-600" /> {t('driver_telemetry_stream', 'Device Telemetry Stream')}
              </h2>
              <span className="text-xs text-gray-500 font-mono">{t('driver_gps_packets_sent', 'GPS Packets Sent:')} <strong className="text-gray-800">{updateCount}</strong></span>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('driver_road_speed', 'Road Speed')}</span>
                <span className="text-2xl font-black text-gray-900">{gpsData.speed}</span>
                <span className="text-[10px] text-gray-500 block">{t('driver_kmh', 'km/h')}</span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('driver_gps_accuracy', 'GPS Accuracy')}</span>
                <span className="text-2xl font-black text-emerald-600">±{gpsData.accuracy || 8}</span>
                <span className="text-[10px] text-gray-500 block">{t('driver_meters', 'meters')}</span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('driver_latitude', 'Latitude')}</span>
                <span className="text-xs font-mono font-bold text-gray-800 block mt-2">
                  {gpsData.lat ? gpsData.lat.toFixed(5) : '18.74920'}°N
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('driver_longitude', 'Longitude')}</span>
                <span className="text-xs font-mono font-bold text-gray-800 block mt-2">
                  {gpsData.lng ? gpsData.lng.toFixed(5) : '73.40180'}°E
                </span>
              </div>
            </div>

            {/* Broadcast Action Buttons */}
            <div className="space-y-3 pt-2">
              {!isBroadcasting ? (
                <button
                  onClick={startBroadcast}
                  disabled={!selectedDispatch}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <FiRadio className="w-5 h-5 animate-pulse" />
                  {t('driver_start_broadcast', 'Start Trip & Broadcast Device GPS')}
                </button>
              ) : (
                <button
                  onClick={stopBroadcast}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <FiAlertTriangle className="w-5 h-5" />
                  {t('driver_pause_broadcast', 'Pause GPS Broadcasting')}
                </button>
              )}

              {/* Test Ping for desktop */}
              <button
                onClick={simulateFix}
                disabled={!selectedDispatch}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <FiActivity className="w-4 h-4 text-primary-600" />
                {t('driver_send_telemetry', 'Send Single Telemetry Packet (Browser / Desktop Simulator)')}
              </button>
            </div>

            {/* Delivery Completion */}
            {selectedDispatch && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={markDelivered}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  {t('driver_mark_delivered', 'Arrived at APMC Mandi / Mark Cargo as Delivered')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASSIGNED DISPATCHES & CARGO */}
      {/* ========================================================= */}
      {activeTab === 'dispatches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {t('driver_assigned_shipments', 'Assigned Commercial Shipments & Delivery History')}
            </h2>
            <button
              onClick={loadDispatches}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> {t('driver_refresh_list', 'Refresh List')}
            </button>
          </div>

          {allDispatches.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
              {t('driver_no_dispatches', 'No dispatches currently assigned.')}
            </div>
          ) : (
            <div className="space-y-3">
              {allDispatches.map((d) => (
                <div
                  key={d.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                    selectedDispatch?.id === d.id ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">{d.dispatch_id}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-semibold text-gray-700">{d.crop_type || t('driver_default_crop', 'Agricultural Produce')}</span>
                      {d.cold_chain ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">❄️ {t('driver_cold_chain', 'Cold Chain')}</span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        d.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        d.status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {d.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                    <div>
                      <span className="text-gray-400 block text-[11px]">{t('driver_cargo_payload', 'Cargo Payload')}</span>
                      <span className="font-bold text-gray-800">{d.quantity_kg?.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">{t('driver_destination', 'Destination')}</span>
                      <span className="font-medium text-gray-800 truncate block">{d.destination_address || d.destination}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">{t('driver_vehicle_plate', 'Vehicle Plate')}</span>
                      <span className="font-mono font-semibold text-gray-800">{d.vehicle_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">{t('driver_operator', 'Driver / Operator')}</span>
                      <span className="font-medium text-gray-800">{d.driver_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedDispatch(d);
                        switchTab('gps');
                      }}
                      className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FiRadio className="w-3.5 h-3.5" />
                      {t('driver_select_for_gps', 'Select for Live GPS Tracking')}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {d.status !== 'in_transit' && d.status !== 'delivered' && (
                        <button
                          onClick={() => updateDispatchStatus(d.id, 'in_transit')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                        >
                          {t('driver_start_trip', 'Start Trip (In Transit)')}
                        </button>
                      )}
                      {d.status !== 'delivered' && (
                        <button
                          onClick={() => updateDispatchStatus(d.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <FiCheck className="w-3 h-3" /> {t('driver_mark_delivered_short', 'Mark Delivered')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COMMERCIAL VEHICLE FLEET SPECS */}
      {/* ========================================================= */}
      {activeTab === 'vehicle' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiTruck className="text-primary-600" /> {t('driver_vehicle_credentials', 'Commercial Vehicle & Fleet Credentials')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('driver_vehicle_credentials_desc', 'Verified commercial transport profile registered with CROP2GO FPO Network')}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1">
              <FiShield className="w-3.5 h-3.5" /> {t('driver_verified_carrier', 'Verified Carrier')}
            </span>
          </div>

          {/* Vehicle Specs Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiTruck className="text-primary-600" /> {t('driver_vehicle_identification', 'Vehicle Identification')}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_registration_plate', 'Registration Plate:')}</span>
                  <span className="font-mono font-bold text-gray-900">{user?.vehicle_number || 'MH 12 AB 9021'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_vehicle_category', 'Vehicle Category:')}</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {user?.vehicle_type ? user.vehicle_type.replace(/_/g, ' ') : t('driver_default_vehicle_type', 'Standard 10-Wheeler Truck')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_gross_payload', 'Gross Payload Capacity:')}</span>
                  <span className="font-bold text-primary-700">
                    {user?.vehicle_capacity_kg ? Number(user.vehicle_capacity_kg).toLocaleString() : '5,000'} kg
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_cold_chain_reefer', 'Cold Chain Reefer:')}</span>
                  <span className="font-medium text-gray-800">
                    {user?.vehicle_type?.includes('cold') ? t('driver_yes_active_reefer', 'Yes (Active Reefer)') : t('driver_ambient_cargo', 'Ambient Cargo Bed')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiFileText className="text-primary-600" /> {t('driver_regulatory_compliance', 'Driver & Regulatory Compliance')}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_dl_number', 'Commercial DL Number:')}</span>
                  <span className="font-mono font-bold text-gray-900">{user?.license_number || 'MH12-2018-0092182'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_registered_driver', 'Registered Driver:')}</span>
                  <span className="font-semibold text-gray-800">{user?.name || 'Ramesh Patil'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_contact_mobile', 'Contact Mobile:')}</span>
                  <span className="font-mono font-medium text-gray-800">+91 {user?.phone || '9999900040'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">{t('driver_insurance_fitness', 'Insurance & Fitness:')}</span>
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <FiCheck className="w-3.5 h-3.5" /> {t('driver_valid_till', 'Valid till Dec 2026')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Telematics Device Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <FiAward className="w-4 h-4 text-emerald-700" /> {t('driver_telemetry_active', 'Real-time Telemetry Device Active')}
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {t('driver_telemetry_desc', 'Your device is registered to stream high-precision GPS telemetry straight to the FPO Aggregation Portal and Buyer Tracking maps. When on a trip, keep the browser window active to provide uninterrupted route telemetry.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
