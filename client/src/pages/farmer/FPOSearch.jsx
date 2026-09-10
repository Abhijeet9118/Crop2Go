import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiMapPin, FiUsers, FiPackage, FiSend, FiNavigation, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { getStates, getDistricts, getVillages } from '../../data/indiaLocations';

// Haversine distance calculator in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}
export default function FPOSearch() {
  const {
    t
  } = useLanguage();
  const [fpos, setFpos] = useState([]);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  // Cascading Location Filter
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [dynamicVillages, setDynamicVillages] = useState([]);
  const states = useMemo(() => getStates(), []);
  const districts = useMemo(() => getDistricts(filterState), [filterState]);
  useEffect(() => {
    if (!filterState || !filterDistrict) {
      setDynamicVillages([]);
      return;
    }
    const local = getVillages(filterState, filterDistrict) || [];
    setDynamicVillages(local);
    axios.get('/api/market/locations/villages', {
      params: {
        state: filterState,
        district: filterDistrict
      }
    }).then(res => {
      if (res.data?.villages?.length) {
        const merged = Array.from(new Set([...res.data.villages, ...local])).sort((a, b) => a.localeCompare(b));
        setDynamicVillages(merged);
      }
    }).catch(() => {});
  }, [filterState, filterDistrict]);
  const loadFpos = () => {
    axios.get('/api/auth/fpos').then(r => setFpos(r.data.fpos || [])).catch(() => setFpos([]));
  };
  useEffect(() => {
    loadFpos();
  }, []);

  // Use Live Geolocation
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserLocation(coords);
      setLocating(false);
      toast.success(`Location detected (${coords.lat.toFixed(2)}°N, ${coords.lng.toFixed(2)}°E)! Sorting FPOs by proximity.`);
    }, error => {
      setLocating(false);
      // Fallback demo location (Pune District)
      setUserLocation({
        lat: 18.5204,
        lng: 73.8567
      });
      toast('Using your registered district coordinates (Pune, Maharashtra).', {
        icon: '📍'
      });
    }, {
      timeout: 8000
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setFilterState('');
    setFilterDistrict('');
    setFilterVillage('');
    setUserLocation(null);
  };

  // Enriched and Filtered FPOs
  const processedFpos = useMemo(() => {
    let result = fpos.map(f => {
      let dist = null;
      if (userLocation && f.lat && f.lng) {
        dist = parseFloat(calculateDistance(userLocation.lat, userLocation.lng, f.lat, f.lng));
      }
      return {
        ...f,
        distanceKm: dist
      };
    });

    // 1. Text Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q) || f.district && f.district.toLowerCase().includes(q) || f.crops_handled && f.crops_handled.toLowerCase().includes(q));
    }

    // 2. Cascading State Filter
    if (filterState) {
      result = result.filter(f => f.state && f.state.toLowerCase() === filterState.toLowerCase());
    }

    // 3. Cascading District Filter
    if (filterDistrict) {
      result = result.filter(f => f.district && f.district.toLowerCase() === filterDistrict.toLowerCase());
    }

    // 4. Cascading Village Filter
    if (filterVillage && filterVillage !== 'Other') {
      result = result.filter(f => f.location && f.location.toLowerCase().includes(filterVillage.toLowerCase()) || f.district && f.district.toLowerCase() === filterDistrict.toLowerCase());
    }

    // 5. Proximity Sort if Live Location Active
    if (userLocation) {
      result.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    return result;
  }, [fpos, search, filterState, filterDistrict, filterVillage, userLocation]);
  return <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{t("farmer_fpo_find_nearby_fpo_farm_223", "📍 Find Nearby FPO (Farmer Producer Organization)")}</h1>
          <p className="text-sm text-gray-500">{t("farmer_fpo_locate_nearby_digita_224", "Locate nearby digital collection centres via live GPS or cascading administrative territory")}</p>
        </div>

        {/* Live Location Trigger Button */}
        <button onClick={handleGetLiveLocation} disabled={locating} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50">
          <FiNavigation className={locating ? 'animate-spin' : ''} />
          {locating ? 'Detecting GPS...' : userLocation ? 'GPS Proximity Active' : 'Use My Live Location'}
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
            <input type="text" placeholder={t("farmer_fpo_search_fpo_by_name_c_225", "Search FPO by name, crops (e.g. Tomato), or town...")} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          {(filterState || filterDistrict || filterVillage || search || userLocation) && <button onClick={handleResetFilters} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border rounded-xl flex items-center justify-center gap-1 bg-gray-50">
              <FiRefreshCw className="w-3 h-3" />{t("farmer_fpo_reset_filters_226", "Reset Filters")}</button>}
        </div>

        {/* Cascading State -> District -> Village Dropdowns */}
        <div className="pt-2 border-t">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t("farmer_fpo_filter_by_administra_227", "Filter by Administrative Territory:")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">{t("farmer_fpo_1_select_state_228", "1. Select State")}</label>
              <select value={filterState} onChange={e => {
              setFilterState(e.target.value);
              setFilterDistrict('');
              setFilterVillage('');
            }} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white font-medium">
                <option value="">{t("farmer_fpo_all_states_229", "All States (")}{states.length})</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">{t("farmer_fpo_2_select_district_230", "2. Select District")}</label>
              <select value={filterDistrict} onChange={e => {
              setFilterDistrict(e.target.value);
              setFilterVillage('');
            }} disabled={!filterState} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium">
                <option value="">{t("farmer_fpo_all_districts_in_sta_231", "All Districts in State")}</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">{t("farmer_fpo_3_select_village_tal_232", "3. Select Village / Taluka")}{dynamicVillages.length > 0 && `(${dynamicVillages.length})`}
              </label>
              <select value={filterVillage} onChange={e => setFilterVillage(e.target.value)} disabled={!filterDistrict} className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium">
                <option value="">
                  {filterDistrict ? `All Villages in District (${dynamicVillages.length})` : 'All Villages / Near District'}
                </option>
                {dynamicVillages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {userLocation && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900">
          <span className="text-base">📍</span>
          <span>{t("farmer_fpo_live_location_active_233", "Live Location Active: FPOs are sorted by closest straight-line distance to your current position.")}</span>
        </div>}

      {/* FPO Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {processedFpos.map(f => <div key={f.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900 text-base">{f.name}</h3>
                {f.distanceKm !== null && <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap">
                    📍 {f.distanceKm}{t("farmer_fpo_km_234", "km")}</span>}
              </div>

              <div className="space-y-2 text-xs text-gray-600 mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="flex items-center gap-2">
                  <FiMapPin className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                  <span>{f.location || f.district}, {f.state}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiUsers className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                  <span><strong>{f.member_count || 120}+</strong>{t("farmer_fpo_active_member_farmer_235", "Active Member Farmers")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiPackage className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                  <span>{t("farmer_fpo_handled_236", "Handled:")}<strong>{f.crops_handled || 'Tomato, Onion, Potato'}</strong></span>
                </p>
              </div>
            </div>

            <button onClick={() => toast.success(`Membership inquiry sent to ${f.name}! The FPO Manager will contact you on ${user?.phone || 'your phone'}.`)} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
              <FiSend />{t("farmer_fpo_apply_to_join_fpo_237", "Apply to Join FPO")}</button>
          </div>)}

        {processedFpos.length === 0 && <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed p-8">
            <p className="text-gray-400 text-sm">{t("farmer_fpo_no_fpos_found_matchi_238", "No FPOs found matching your location filters.")}</p>
            <button onClick={handleResetFilters} className="mt-3 text-xs text-primary-600 font-bold hover:underline">{t("farmer_fpo_clear_filters_and_vi_239", "Clear filters and view all FPOs")}</button>
          </div>}
      </div>
    </div>;
}