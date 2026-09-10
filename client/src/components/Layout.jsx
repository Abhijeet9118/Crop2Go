import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationCenter from './NotificationCenter';
import { FiHome, FiMenu, FiX, FiLogOut, FiPackage, FiTruck, FiDollarSign, FiBarChart2, FiUsers, FiSearch, FiCloudRain, FiSun, FiMapPin, FiCalendar, FiSettings, FiShoppingCart, FiLayers, FiCpu, FiBox, FiTool, FiChevronRight, FiBell, FiGlobe } from 'react-icons/fi';

const menuItems = {
  farmer: [
    { path: '/farmer', icon: FiHome, label: 'Dashboard', key: 'dashboard', end: true },
    { path: '/farmer/crops', icon: FiPackage, label: 'My Crops', key: 'my_crops' },
    { path: '/farmer/expenses', icon: FiDollarSign, label: 'Expenses', key: 'expenses' },
    { path: '/farmer/mandi-prices', icon: FiBarChart2, label: 'Mandi Prices', key: 'mandi_prices' },
    { path: '/farmer/weather', icon: FiCloudRain, label: 'Weather', key: 'weather' },
    { path: '/farmer/find-fpo', icon: FiSearch, label: 'Find FPO', key: 'find_fpo' },
    { path: '/farmer/produce', icon: FiBox, label: 'My Produce', key: 'my_produce' },
    { path: '/farmer/payments', icon: FiDollarSign, label: 'Payments', key: 'payments' },
    { path: '/farmer/equipment', icon: FiTool, label: 'Machinery & Equipment', key: 'equipment' },
    { path: '/farmer/transport', icon: FiTruck, label: 'Transport', key: 'transport' },
  ],
  fpo_admin: [
    { path: '/fpo', icon: FiHome, label: 'Dashboard', key: 'dashboard', end: true },
    { path: '/fpo/collection', icon: FiPackage, label: 'Collection', key: 'collection' },
    { path: '/fpo/weighing', icon: FiLayers, label: 'Weighing', key: 'weighing' },
    { path: '/fpo/grading', icon: FiSearch, label: 'AI Grading', key: 'grading' },
    { path: '/fpo/aggregation', icon: FiBox, label: 'Aggregation', key: 'aggregation' },
    { path: '/fpo/inventory', icon: FiBarChart2, label: 'Inventory', key: 'inventory' },
    { path: '/fpo/ai-engine', icon: FiCpu, label: 'AI Insights', key: 'ai_insights' },
    { path: '/fpo/buyers', icon: FiUsers, label: 'Buyers', key: 'buyers' },
    { path: '/fpo/processing', icon: FiSettings, label: 'Processing', key: 'processing' },
    { path: '/fpo/dispatch', icon: FiTruck, label: 'Live GPS Dispatch', key: 'dispatch' },
    { path: '/fpo/payments', icon: FiDollarSign, label: 'Payments', key: 'payments' },
    { path: '/fpo/transport', icon: FiMapPin, label: 'Transport Ops', key: 'transport' },
  ],
  fpo_worker: [
    { path: '/fpo', icon: FiHome, label: 'Dashboard', key: 'dashboard', end: true },
    { path: '/fpo/collection', icon: FiPackage, label: 'Collection', key: 'collection' },
    { path: '/fpo/weighing', icon: FiLayers, label: 'Weighing', key: 'weighing' },
    { path: '/fpo/grading', icon: FiSearch, label: 'AI Grading', key: 'grading' },
    { path: '/fpo/inventory', icon: FiBarChart2, label: 'Inventory', key: 'inventory' },
  ],
  buyer: [
    { path: '/buyer', icon: FiHome, label: 'Dashboard', key: 'dashboard', end: true },
    { path: '/buyer/lots', icon: FiPackage, label: 'Available Lots', key: 'nav_available_lots' },
    { path: '/buyer/orders', icon: FiShoppingCart, label: 'My Orders', key: 'nav_my_orders' },
    { path: '/buyer/tracking', icon: FiTruck, label: 'Track Shipments', key: 'nav_track_shipments' },
  ],
  transporter: [
    { path: '/transport', icon: FiTruck, label: 'GPS Transmitter & Active Trip', key: 'transport', end: true },
    { path: '/transport?tab=dispatches', icon: FiPackage, label: 'Assigned Dispatches & Cargo', key: 'nav_assigned_dispatches' },
    { path: '/transport?tab=vehicle', icon: FiSettings, label: 'Commercial Vehicle Specs', key: 'nav_vehicle_specs' },
  ],
  driver: [
    { path: '/transport', icon: FiTruck, label: 'GPS Transmitter & Active Trip', key: 'transport', end: true },
    { path: '/transport?tab=dispatches', icon: FiPackage, label: 'Assigned Dispatches & Cargo', key: 'nav_assigned_dispatches' },
    { path: '/transport?tab=vehicle', icon: FiSettings, label: 'Commercial Vehicle Specs', key: 'nav_vehicle_specs' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { currentLang, changeLanguage, languages, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = menuItems[user?.role] || menuItems.farmer;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary-800 text-white transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-bold tracking-tight">CROP2GO</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-primary-200 hover:text-white">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-hide">
          {items.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-600 text-white font-medium shadow-sm' : 'text-primary-200 hover:bg-primary-700 hover:text-white'}`}
              onClick={() => setSidebarOpen(false)}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.key ? t(item.key, item.label) : item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-700">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-200 hover:bg-primary-700 hover:text-white w-full transition-colors">
            <FiLogOut className="w-5 h-5" /> {t('logout', 'Logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700">
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">{t('common_welcome', 'Welcome,')}</span>
              <span className="font-semibold text-gray-800">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || 'User')}
              </span>
              <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full font-medium capitalize">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 text-sm">
              <FiGlobe className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-gray-800 text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <NotificationCenter />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
