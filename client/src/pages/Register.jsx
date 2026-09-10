import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { FiUser, FiUsers, FiShoppingCart, FiTruck, FiCheck, FiAlertCircle, FiMapPin, FiSearch } from 'react-icons/fi';
import { getStates, getDistricts, getVillages } from '../data/indiaLocations';

const roles = [
  { value: 'farmer', label: 'Farmer', icon: FiUser, desc: 'Log crops, expenses, book equipment' },
  { value: 'fpo_admin', label: 'FPO Admin', icon: FiUsers, desc: 'Manage FPO collection & dispatch' },
  { value: 'buyer', label: 'Buyer', icon: FiShoppingCart, desc: 'Purchase wholesale produce' },
  { value: 'transporter', label: 'Transporter', icon: FiTruck, desc: 'Transport crops & stream live GPS' },
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'farmer',
    state: '',
    district: '',
    village: '',
    business_name: '',
    business_type: 'trader',
    vehicle_number: '',
    vehicle_type: 'standard_truck',
    vehicle_capacity_kg: '5000',
    license_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [customVillage, setCustomVillage] = useState(false);
  const [customVillageName, setCustomVillageName] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [dynamicVillages, setDynamicVillages] = useState([]);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Load all 36 States & UTs across India
  const states = useMemo(() => getStates(), []);
  // Load all districts for the selected state
  const districts = useMemo(() => getDistricts(form.state), [form.state]);

  // Fetch full official villages from backend API whenever state or district changes
  useEffect(() => {
    if (!form.state || !form.district) {
      setDynamicVillages([]);
      setVillageSearch('');
      setCustomVillage(false);
      return;
    }

    // Initialize immediately with local static villages
    const local = getVillages(form.state, form.district) || [];
    setDynamicVillages(local);
    setLoadingVillages(true);

    axios.get('/api/market/locations/villages', {
      params: { state: form.state, district: form.district }
    })
      .then(res => {
        if (res.data && Array.isArray(res.data.villages) && res.data.villages.length > 0) {
          const merged = Array.from(new Set([...res.data.villages, ...local])).sort((a, b) => a.localeCompare(b));
          setDynamicVillages(merged);
        }
      })
      .catch(() => {
        // Fallback already set to local
      })
      .finally(() => {
        setLoadingVillages(false);
      });
  }, [form.state, form.district]);

  // Filtered villages based on quick search
  const displayVillages = useMemo(() => {
    if (!villageSearch.trim()) return dynamicVillages;
    const term = villageSearch.trim().toLowerCase();
    return dynamicVillages.filter(v => v.toLowerCase().includes(term));
  }, [dynamicVillages, villageSearch]);

  const passwordsMatch = form.password && form.confirm_password && form.password === form.confirm_password;
  const passwordMismatch = form.confirm_password && form.password !== form.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error(t('register_password_mismatch', 'Passwords do not match'));
      return;
    }

    const finalVillage = customVillage ? customVillageName.trim() : form.village;
    if (form.role !== 'buyer' && !finalVillage) {
      toast.error(t('register_village_required', 'Please select or enter your village'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        password: form.password,
        role: form.role,
        state: form.state,
        district: form.district,
        village: finalVillage,
        business_name: form.business_name,
        business_type: form.business_type,
        vehicle_number: form.vehicle_number,
        vehicle_type: form.vehicle_type,
        vehicle_capacity_kg: form.vehicle_capacity_kg,
        license_number: form.license_number
      };

      const user = await register(payload);
      toast.success(t('register_welcome', 'Welcome to CROP2GO, ') + user.name + '!');
      if (user.role === 'buyer') navigate('/buyer');
      else if (user.role === 'fpo_admin') navigate('/fpo');
      else if (user.role === 'transporter' || user.role === 'driver') navigate('/transport');
      else navigate('/farmer');
    } catch (err) {
      toast.error(err.response?.data?.error || t('register_failed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const u = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleStateChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, state: val, district: '', village: '' }));
    setCustomVillage(false);
    setCustomVillageName('');
    setVillageSearch('');
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, district: val, village: '' }));
    setCustomVillage(false);
    setCustomVillageName('');
    setVillageSearch('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌾</div>
          <h1 className="text-3xl font-bold text-white">Join CROP2GO</h1>
          <p className="text-primary-100 text-sm mt-1">AI-Integrated Digital FPO Platform</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Role selector buttons - 4 Primary Platform Roles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {roles.map(r => (
              <button key={r.value} type="button" onClick={() => u('role', r.value)}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${form.role === r.value ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <r.icon className={`w-5 h-5 mx-auto mb-1 ${form.role === r.value ? 'text-primary-600' : 'text-gray-400'}`} />
                <p className="text-xs font-bold text-gray-800">{r.label}</p>
                <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={form.name}
                onChange={e => u('name', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit Mobile Number"
                value={form.phone}
                onChange={e => u('phone', e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                required
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Create Password"
                  value={form.password}
                  onChange={e => u('password', e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">Confirm Password</label>
                  {passwordsMatch && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                      <FiCheck className="w-3 h-3" /> Matched
                    </span>
                  )}
                  {passwordMismatch && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                      <FiAlertCircle className="w-3 h-3" /> Mismatch
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Re-enter Password"
                  value={form.confirm_password}
                  onChange={e => u('confirm_password', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none text-sm ${passwordsMatch ? 'border-green-400 focus:ring-green-400' : passwordMismatch ? 'border-red-400 focus:ring-red-400' : 'focus:ring-primary-500'}`}
                  required
                />
              </div>
            </div>

            {/* Cascading State -> District -> Village Selection (All India Coverage) */}
            {form.role !== 'buyer' && (
              <div className="space-y-2 pt-2 border-t mt-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <FiMapPin className="text-primary-600" /> Pan-India Location (All States & Districts)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* State Selection */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 font-medium">1. State / UT</label>
                    <select
                      value={form.state}
                      onChange={handleStateChange}
                      className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs bg-white font-medium"
                      required
                    >
                      <option value="">Select State ({states.length})</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* District Selection */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 font-medium">2. District</label>
                    <select
                      value={form.district}
                      onChange={handleDistrictChange}
                      disabled={!form.state}
                      className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium"
                      required
                    >
                      <option value="">Select District ({districts.length})</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Village / Taluka Selection with Auto-complete Datalist + Direct Typing */}
                  {/* Village / Taluka Selection Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500 font-medium">3. Village / Taluka</label>
                      {loadingVillages && (
                        <span className="text-[10px] text-amber-600 animate-pulse font-medium">
                          Loading villages...
                        </span>
                      )}
                      {!loadingVillages && form.district && (
                        <span className="text-[10px] text-primary-700 font-semibold">
                          {dynamicVillages.length} villages
                        </span>
                      )}
                    </div>

                    {!customVillage ? (
                      <div className="space-y-1.5">
                        <select
                          value={form.village}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__other__') {
                              setCustomVillage(true);
                              u('village', '');
                            } else {
                              u('village', val);
                            }
                          }}
                          disabled={!form.district}
                          className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium"
                          required={!customVillage}
                        >
                          <option value="">
                            {form.district ? `Select Village (${dynamicVillages.length} available)` : 'Select district first'}
                          </option>
                          <option value="__other__">➕ Other / Enter Custom Village Name</option>
                          {displayVillages.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>

                        {/* Search filter for large village lists */}
                        {dynamicVillages.length > 10 && (
                          <div className="relative">
                            <FiSearch className="absolute left-2.5 top-2.5 text-gray-400 w-3 h-3" />
                            <input
                              type="text"
                              placeholder={`Filter ${dynamicVillages.length} villages in ${form.district}...`}
                              value={villageSearch}
                              onChange={e => setVillageSearch(e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-[11px] outline-none focus:border-primary-400 bg-gray-50/50"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Type village or wadi name..."
                            value={customVillageName}
                            onChange={e => setCustomVillageName(e.target.value)}
                            className="w-full px-3 py-2 border border-primary-500 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs bg-white font-medium"
                            required
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomVillage(false);
                              setCustomVillageName('');
                            }}
                            className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 whitespace-nowrap"
                          >
                            Back to List
                          </button>
                        </div>
                        <p className="text-[10px] text-primary-700">Enter your specific village/wadi name directly</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 italic">
                  💡 All 788 districts and 200,000+ authentic villages across India are supported.
                </p>
              </div>
            )}

            {form.role === 'buyer' && (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Details</p>
                <input
                  placeholder="Business / Firm Name"
                  value={form.business_name}
                  onChange={e => u('business_name', e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  required
                />
                <select
                  value={form.business_type}
                  onChange={e => u('business_type', e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                >
                  <option value="trader">Trader (Mandi/APMC)</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="processor">Food Processing Industry</option>
                  <option value="retailer">Retail Chain / Exporter</option>
                </select>
              </div>
            )}

            {form.role === 'transporter' && (
              <div className="space-y-3 pt-2 border-t mt-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <FiTruck className="text-primary-600" /> Commercial Vehicle & Fleet Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1 font-medium">Vehicle Registration Plate</label>
                    <input
                      placeholder="e.g. MH 12 AB 9021"
                      value={form.vehicle_number}
                      onChange={e => u('vehicle_number', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs font-mono uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1 font-medium">Vehicle Type</label>
                    <select
                      value={form.vehicle_type}
                      onChange={e => u('vehicle_type', e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs bg-white font-medium"
                    >
                      <option value="standard_truck">Standard Truck (10-16 Ton)</option>
                      <option value="mini_truck">Mini Truck / Pickup (1.5-3 Ton)</option>
                      <option value="cold_chain">Refrigerated / Cold Chain Reefer</option>
                      <option value="tractor_trailer">Tractor Trolley / Trailer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1 font-medium">Payload Capacity (KG)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={form.vehicle_capacity_kg}
                      onChange={e => u('vehicle_capacity_kg', e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1 font-medium">Commercial Driver License</label>
                    <input
                      placeholder="e.g. MH1220180092182"
                      value={form.license_number}
                      onChange={e => u('license_number', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-xs uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full mt-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md text-sm"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
