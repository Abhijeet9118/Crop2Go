import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FiArrowRight, FiShield, FiTrendingUp, FiTruck, 
  FiDollarSign, FiCpu, FiPackage, FiGlobe, FiPlay, FiPause,
  FiUsers, FiMapPin, FiBarChart2, FiLock, FiCheck, FiChevronRight,
  FiChevronLeft, FiVolume2, FiVolumeX, FiCheckCircle
} from 'react-icons/fi';

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentLang, changeLanguage, languages, t } = useLanguage();
  const navigate = useNavigate();

  // 6 Curated, Ultra-High-Definition & Attractive Agricultural Background Themes
  const bgThemes = [
    {
      id: 'sunrise',
      name: 'Golden Sunrise',
      icon: '🌅',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85',
      overlay: 'from-emerald-950/75 via-slate-900/60 to-slate-900/80'
    },
    {
      id: 'harvest',
      name: 'Golden Harvest',
      icon: '🌾',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=85',
      overlay: 'from-emerald-950/70 via-slate-950/55 to-slate-900/85'
    },
    {
      id: 'terraces',
      name: 'Lush Terraces',
      icon: '🌿',
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=2000&q=85',
      overlay: 'from-slate-950/70 via-emerald-950/50 to-slate-900/85'
    },
    {
      id: 'produce',
      name: 'Fresh Harvest',
      icon: '🍅',
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=2000&q=85',
      overlay: 'from-emerald-950/75 via-slate-900/65 to-slate-900/85'
    },
    {
      id: 'smartag',
      name: 'Smart Ag-Tech',
      icon: '🛰️',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2000&q=85',
      overlay: 'from-slate-950/75 via-emerald-950/60 to-slate-900/85'
    },
    {
      id: 'soil',
      name: 'Living Soil',
      icon: '🌱',
      image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=2000&q=85',
      overlay: 'from-emerald-950/75 via-slate-950/60 to-slate-900/85'
    }
  ];

  const [currentBgIdx, setCurrentBgIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Smooth cinematic auto-rotation every 6 seconds
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentBgIdx((prev) => (prev + 1) % bgThemes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlay, bgThemes.length]);

  const prevBg = () => {
    setCurrentBgIdx((prev) => (prev - 1 + bgThemes.length) % bgThemes.length);
  };

  const nextBg = () => {
    setCurrentBgIdx((prev) => (prev + 1) % bgThemes.length);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'buyer') return '/buyer';
    if (user.role === 'fpo_admin' || user.role === 'fpo_worker') return '/fpo';
    if (user.role === 'transporter' || user.role === 'driver') return '/transport';
    return '/farmer';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* 🇮🇳 TOP TRICOLOR GOVT OF INDIA ACCENT STRIP */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"></div>

      {/* TOP OFFICIAL GOVERNMENT HEADER BAR */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Emblem & Ministry */}
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <span className="font-semibold text-white tracking-wide">{t('home_govt', 'Government of India')}</span>
            <span className="text-slate-600 hidden md:inline">&bull;</span>
            <span className="text-slate-400 hidden md:inline">{t('home_ministry', 'Ministry of Agriculture & Farmers Welfare')}</span>
          </div>

          {/* Right: Language Switcher */}
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-medium hidden sm:inline flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {t('home_agristack', 'AgriStack Compliant')}
            </span>
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              <FiGlobe className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-white text-[11px] font-medium focus:outline-none cursor-pointer pr-1"
                aria-label="Official Language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="text-slate-900">
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PORTAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-primary-900 text-white flex items-center justify-center text-xl shadow-xs border border-emerald-500">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 font-serif">CROP2GO</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300 font-mono">
                  National Ag-Grid
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                {t('home_tagline', 'Post-Harvest Logistics & Farmgate Settlement DPI')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-700">
            <a href="#pillars" className="hover:text-emerald-700 transition-colors">Core Pillars</a>
            <a href="#pillars" className="hover:text-emerald-700 transition-colors">Platform Pillars</a>
            <a href="#consoles" className="hover:text-emerald-700 transition-colors">{t('home_nav_consoles', 'Stakeholder Consoles')}</a>
          </nav>

          {/* Corner Portal Sign-In / Dashboard Hub */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>{t('home_open_console', 'Open Console')}</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 font-medium"
                >
                  {t('home_logout', 'Logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <FiLock className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{t('home_sign_in', 'Sign In')}</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {t('home_register', 'Register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🔴 SLENDER LIVE APMC MARKET TICKER */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            LIVE APMC
          </span>
          <div className="truncate flex-1">
            <span className="text-emerald-400 font-semibold">{t('home_ticker_1', 'Vashi Tomato: ₹38/kg (+4.2%)')}</span>
            <span className="mx-3 text-slate-600">&bull;</span>
            <span className="text-emerald-400 font-semibold">{t('home_ticker_2', 'Azadpur: ₹42/kg (+6.8%)')}</span>
            <span className="mx-3 text-slate-600">&bull;</span>
            <span>{t('home_ticker_3', 'Lasalgaon Onion: ₹24/kg')}</span>
            <span className="mx-3 text-slate-600">&bull;</span>
            <span className="text-blue-300">{t('home_ticker_4', 'Reefer MH12AB9021: 12.2°C active on Expressway')}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HERO SECTION: VIBRANT, ATTRACTIVE SUNLIT AGRICULTURAL BACKGROUND
          ========================================================================= */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-24 lg:pt-22 lg:pb-32">
        {/* Cinematic Crossfading High-Resolution Photographic Backgrounds */}
        {bgThemes.map((theme, idx) => (
          <div
            key={theme.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentBgIdx === idx ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={theme.image}
              alt={theme.name}
              className="w-full h-full object-cover filter brightness-105 contrast-105 scale-105 transition-all duration-1000"
            />
            {/* Luminous GovTech Gradient Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.overlay} pointer-events-none`}></div>
          </div>
        ))}

        {/* Global Luminous Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-emerald-600/15 to-transparent z-10 pointer-events-none"></div>

        {/* Ambient Warm Solar & Emerald Glow Orbs */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none z-10"></div>
        <div className="absolute top-1/3 right-12 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none z-10"></div>

        {/* Interactive Background Theme & Slideshow Selector */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Active Image Indicator & Slideshow Status */}
          <div className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/70 px-3 py-1 rounded-full text-xs text-slate-300 shadow-xl">
            <span className="text-emerald-400 font-bold">{bgThemes[currentBgIdx].icon}</span>
            <span className="font-semibold text-white">{bgThemes[currentBgIdx].name}</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[10px] text-slate-400">{currentBgIdx + 1} / {bgThemes.length}</span>
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              title={isAutoPlay ? 'Pause Auto-Slideshow' : 'Resume Auto-Slideshow'}
              className="ml-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono flex items-center gap-1 transition-all"
            >
              {isAutoPlay ? <FiPause className="w-3 h-3 text-amber-400" /> : <FiPlay className="w-3 h-3 text-emerald-400" />}
              <span className="text-[10px] hidden sm:inline">{isAutoPlay ? 'Auto (6s)' : 'Paused'}</span>
            </button>
          </div>

          {/* Quick Nav Arrows & Theme Pills */}
          <div className="inline-flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-full text-xs text-slate-300 shadow-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={prevBg}
              title="Previous Photo"
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <FiChevronLeft className="w-3.5 h-3.5" />
            </button>
            {bgThemes.map((theme, idx) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => { setCurrentBgIdx(idx); setIsAutoPlay(false); }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 flex-shrink-0 ${
                  currentBgIdx === idx
                    ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{theme.icon}</span>
                <span className="hidden md:inline">{theme.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={nextBg}
              title="Next Photo"
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Content (Clean, Powerful, Authoritative) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20 space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-950/85 border border-emerald-400/40 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t('home_hero_badge', 'Ministry of Agriculture • National Post-Harvest Quality & Logistics Initiative')}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-serif drop-shadow-xl">
            {t('home_hero_title', 'From Farm to Retail, Transparent & Empowered.')}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl font-medium text-emerald-300 max-w-2xl mx-auto drop-shadow-md">
            {t('home_hero_subtitle', 'India\'s Unified Post-Harvest Ag-Logistics, Quality Grading & Direct Farmer Settlement Grid')}
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all text-sm flex items-center gap-2"
            >
              <span>{t('home_hero_btn_enter', 'Enter Platform')}</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#pillars"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold px-6 py-3.5 rounded-xl backdrop-blur-md transition-all text-sm flex items-center gap-2 shadow-md"
            >
              <FiShield className="w-4 h-4 text-emerald-400" />
              <span>Explore Platform Pillars</span>
            </a>
          </div>

          {/* Minimal 4-Pillar Stat Row */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto">
            <div className="bg-slate-900/85 p-4 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg text-center hover:border-emerald-500/50 transition-colors">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">10,000+</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">FPOs Connected</div>
            </div>
            <div className="bg-slate-900/85 p-4 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg text-center hover:border-emerald-500/50 transition-colors">
              <div className="text-xl sm:text-2xl font-black text-emerald-300">+35%</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">{t('home_metric_income_title', 'Farmer Income Increase')}</div>
            </div>
            <div className="bg-slate-900/85 p-4 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg text-center hover:border-emerald-500/50 transition-colors">
              <div className="text-xl sm:text-2xl font-black text-amber-400">&lt; 5%</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">{t('home_metric_spoilage_title', 'Cold-Chain Spoilage')}</div>
            </div>
            <div className="bg-slate-900/85 p-4 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg text-center hover:border-emerald-500/50 transition-colors">
              <div className="text-xl sm:text-2xl font-black text-blue-400">&lt; 24h</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">{t('home_metric_payment_title', 'Direct DBT Payout')}</div>
            </div>
          </div>
        </div>

        {/* ✨ SEAMLESS GRADIENT FEATHER: DISSOLVES GENTLY INTO THE MANDI RATES SECTION */}
        <div className="absolute -bottom-1 inset-x-0 h-24 bg-gradient-to-t from-slate-50 via-slate-50/85 to-transparent pointer-events-none z-10"></div>
      </section>

      {/* =========================================================================
          SECTION 3: 4 CORE PLATFORM PILLARS (CLEAN & MINIMAL)
          ========================================================================= */}
      <section id="pillars" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700">Unified Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Four Core Pillars of CROP2GO</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Transforming fragmented agricultural supply chains into a synchronized, transparent, and fair national network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mb-4 border border-emerald-100">
                👁️
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">AI Computer Vision Grading</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Non-destructive quality grading from standard smartphone photos. Classifies lots into Agmark Grade-A, B, and C in under 2 seconds.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl mb-4 border border-blue-100">
                🚛
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Hardware-Free Reefer Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Truck drivers transmit live GPS and cold-chain temperature telemetry using browser geolocation without proprietary hardware.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl mb-4 border border-purple-100">
                ⚡
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Direct 24h Bank Settlement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct IMPS payments deposited into farmer bank accounts within 24 hours of delivery, eliminating intermediary deductions.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl mb-4 border border-amber-100">
                🤝
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Direct Institutional Marketplace</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects 10,000+ FPOs directly with institutional bulk buyers like Reliance Fresh, Mother Dairy, and ONDC with escrow security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: 4 STAKEHOLDER PORTALS (DIRECT ROLE ACCESS)
          ========================================================================= */}
      <section id="consoles" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700">Dedicated Portals</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{t('home_consoles_title', 'Four Integrated Stakeholder Consoles')}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Role-tailored dashboards providing specialized workflows for every node in the agricultural chain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Farmer */}
            <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🌾</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Producer</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{t('home_console_farmer_title', 'Farmer Console')}</h3>
                <p className="text-xs text-slate-600 mb-4">{t('home_console_farmer_desc', 'Log harvests, request shared village transport, view weighbridge receipts, and track direct bank payouts.')}</p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <span>Enter Portal</span>
                <FiChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 2. FPO */}
            <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🏢</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Aggregator</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{t('home_console_fpo_title', 'FPO Command Center')}</h3>
                <p className="text-xs text-slate-600 mb-4">{t('home_console_fpo_desc', 'Digitize farmgate weighments, run AI quality grading, assemble master lots, and manage buyer contracts.')}</p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <span>Enter Portal</span>
                <FiChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 3. Transporter */}
            <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🚛</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Logistics</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{t('home_console_trans_title', 'Cold-Chain FleetOps')}</h3>
                <p className="text-xs text-slate-600 mb-4">{t('home_console_trans_desc', 'Browser-based GPS transmitter for drivers, reefer temperature monitoring, and electronic delivery confirmation.')}</p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <span>Enter Portal</span>
                <FiChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4. Buyer */}
            <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🛒</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Off-Taker</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{t('home_console_buyer_title', 'Buyer Desk')}</h3>
                <p className="text-xs text-slate-600 mb-4">{t('home_console_buyer_desc', 'Browse certified Grade-A lots from verified FPOs, lock escrow contracts, and track refrigerated shipments live.')}</p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <span>Enter Portal</span>
                <FiChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION & OFFICIAL MINIMAL FOOTER
          ========================================================================= */}
      <section className="py-14 bg-emerald-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black font-serif">
            Empowering India's Farmgate Logistics
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
            Join thousands of farmers, FPOs, and buyers on the national post-harvest digital public infrastructure.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-950 font-black px-7 py-3 rounded-xl shadow-md transition-all text-sm"
            >
              <span>Access CROP2GO Portal</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* OFFICIAL GOVERNMENT-STYLE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌾</span>
            <span className="font-bold text-white tracking-wide">CROP2GO Ag-Grid</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400 text-[11px]">{t('home_footer_team', 'Developed for National Agricultural Cold-Chain Grid • Ministry of Agriculture & Farmers Welfare')}</span>
          </div>

          <div className="text-[11px] text-slate-500">
            {t('home_footer_rights', '© 2026 CROP2GO. Open-source Digital Public Good. All rights reserved.')}
          </div>
        </div>
      </footer>

      {/* 🇮🇳 BOTTOM TRICOLOR GOVT OF INDIA ACCENT STRIP */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"></div>
    </div>
  );
}
