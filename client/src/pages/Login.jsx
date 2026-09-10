import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiGlobe, FiPhone, FiLock, FiUser, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Login() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { currentLang, changeLanguage, languages, t } = useLanguage();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    // Only allow numeric digits and cap at 10 digits
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(phone)) {
      toast.error(t('login_phone_error', 'Please enter a valid 10-digit phone number (e.g. 9876543210)'));
      return;
    }

    setLoading(true);
    try {
      const user = await login(phone, password, firstName, lastName);
      toast.success(t('login_welcome_back', 'Welcome back, ') + (firstName ? `${firstName} ${lastName}`.trim() : user.name) + '!');
      if (user.role === 'buyer') navigate('/buyer');
      else if (user.role === 'fpo_admin' || user.role === 'fpo_worker') navigate('/fpo');
      else if (user.role === 'transporter' || user.role === 'driver') navigate('/transport');
      else navigate('/farmer');
    } catch (err) {
      toast.error(err.response?.data?.error || t('login_failed', 'Login failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950 font-sans">
      {/* Background Image of Farmers */}
      <img
        src="/farmer_login_bg.jpg"
        alt="Indian Farmers in Agricultural Field"
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.78] contrast-105 scale-105"
      />

      {/* Luminous GovTech Gradient & Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-emerald-950/70 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/30 to-slate-950/85 pointer-events-none"></div>

      {/* Top Gov Tricolor Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] z-30"></div>

      <div className="w-full max-w-md relative z-20 my-8">
        {/* Top Header: Back to Home + Language Selector */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-200 hover:text-white bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-md font-medium"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>{t('home_back', 'Back to Home')}</span>
          </Link>

          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs shadow-md">
            <FiGlobe className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="text-gray-900">
                  {l.native} ({l.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-primary-900 text-white flex items-center justify-center text-2xl shadow-xl border border-emerald-400/50 mb-3">
            🌾
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg font-serif">CROP2GO</h1>
          <p className="text-emerald-200 text-xs mt-1 drop-shadow font-medium tracking-wide">
            {t('tagline', 'National Farmgate Settlement & Ag-Logistics Platform')}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/40">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('login', 'Sign In')}</h2>
          <p className="text-xs text-gray-500 mb-5">{t('login_subtitle', 'Enter your verified details to access your portal')}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('first_name', 'First Name')}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rajesh"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('last_name', 'Last Name')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kumar"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* 10 Digit Phone Number */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  {t('phone', 'Phone Number (10 digits only)')}
                </label>
                <span className={`text-[11px] font-mono ${phone.length === 10 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                  {phone.length}/10
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-semibold select-none">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="9999900001"
                  pattern="^[0-9]{10}$"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono tracking-wider"
                  required
                />
              </div>
              {phone.length > 0 && phone.length < 10 && (
                <p className="text-[11px] text-amber-600 mt-1">{t('login_phone_validation', 'Must be exactly 10 digits.')}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('password', 'Password')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? t('login_authenticating', 'Authenticating...') : t('login', 'Sign In')}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 via-primary-500/10 to-emerald-500/10 border border-emerald-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-pulse">🎙️</span>
              <div>
                <p className="text-xs font-bold text-emerald-900">{t('login_voice_title', 'Hands-Free Voice Login')}</p>
                <p className="text-[10px] text-emerald-800">
                  {t('login_voice_hint', 'Tap the mic icon (bottom-right) & say:')} <span className="font-semibold italic">"Ramesh Patel login karo"</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
              AI Voice
            </span>
          </div>

          <div className="mt-4 p-3.5 bg-primary-50 border border-primary-100 rounded-xl">
            <p className="text-xs font-semibold text-primary-900 mb-2">👤 {t('login_quick_demo', 'Verified Role Profiles (Click to Autofill):')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => { setPhone('9999900001'); setPassword('password123'); }}
                className="p-2 bg-white rounded-lg border border-primary-200 text-left hover:border-primary-500 hover:shadow-xs transition-all"
              >
                <div className="text-[10px] text-gray-500 font-sans">{t('common_fpo_admin', 'FPO Admin')}</div>
                <div className="font-bold text-primary-900">9999900001</div>
              </button>
              <button
                type="button"
                onClick={() => { setPhone('9999900010'); setPassword('password123'); }}
                className="p-2 bg-white rounded-lg border border-primary-200 text-left hover:border-primary-500 hover:shadow-xs transition-all"
              >
                <div className="text-[10px] text-gray-500 font-sans">{t('common_farmer', 'Farmer')}</div>
                <div className="font-bold text-primary-900">9999900010</div>
              </button>
              <button
                type="button"
                onClick={() => { setPhone('9999900020'); setPassword('password123'); }}
                className="p-2 bg-white rounded-lg border border-primary-200 text-left hover:border-primary-500 hover:shadow-xs transition-all"
              >
                <div className="text-[10px] text-gray-500 font-sans">{t('common_buyer', 'Buyer')}</div>
                <div className="font-bold text-primary-900">9999900020</div>
              </button>
              <button
                type="button"
                onClick={() => { setPhone('9999900040'); setPassword('password123'); }}
                className="p-2 bg-white rounded-lg border border-primary-200 text-left hover:border-primary-500 hover:shadow-xs transition-all"
              >
                <div className="text-[10px] text-gray-500 font-sans">{t('common_transporter', 'Transporter / Driver')}</div>
                <div className="font-bold text-emerald-700">9999900040</div>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2 font-mono">{t('login_demo_password', 'Password: password123')}</p>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            {t('login_no_account', "Don't have an account?")}{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              {t('register', 'Register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
