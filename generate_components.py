import os

BASE_DIR = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src"

files = {
    "components/Layout.jsx": """import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiUsers, FiPackage, FiTruck, FiDollarSign, 
  FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX,
  FiTrendingUp, FiCloudRain, FiSun, FiMapPin, FiCalendar, FiClock, FiStar,
  FiChevronRight, FiEye, FiDownload, FiSearch, FiFilter, FiEdit, FiTrash, FiCheck, FiAlertTriangle
} from 'react-icons/fi';

const farmerLinks = [
  { name: 'Dashboard', path: '/farmer/dashboard', icon: FiHome },
  { name: 'My Crops', path: '/farmer/crops', icon: FiPackage },
  { name: 'Expenses', path: '/farmer/expenses', icon: FiDollarSign },
  { name: 'Mandi Prices', path: '/farmer/mandi', icon: FiTrendingUp },
  { name: 'Weather', path: '/farmer/weather', icon: FiCloudRain },
  { name: 'Find FPO', path: '/farmer/fpos', icon: FiSearch },
  { name: 'My Produce', path: '/farmer/produce', icon: FiBox },
  { name: 'Payments', path: '/farmer/payments', icon: FiDollarSign },
  { name: 'Equipment', path: '/farmer/equipment', icon: FiSettings },
  { name: 'Transport', path: '/farmer/transport', icon: FiTruck },
];

const fpoLinks = [
  { name: 'Dashboard', path: '/fpo/dashboard', icon: FiHome },
  { name: 'Collection', path: '/fpo/collection', icon: FiDownload },
  { name: 'Weighing', path: '/fpo/weighing', icon: FiBarChart2 },
  { name: 'Grading', path: '/fpo/grading', icon: FiStar },
  { name: 'Aggregation', path: '/fpo/aggregation', icon: FiPackage },
  { name: 'Inventory', path: '/fpo/inventory', icon: FiBox },
  { name: 'AI Insights', path: '/fpo/ai-insights', icon: FiAlertTriangle },
  { name: 'Buyers', path: '/fpo/buyers', icon: FiUsers },
  { name: 'Processing', path: '/fpo/processing', icon: FiSettings },
  { name: 'Dispatch', path: '/fpo/dispatch', icon: FiTruck },
  { name: 'Payments', path: '/fpo/payments', icon: FiDollarSign },
  { name: 'Equipment', path: '/fpo/equipment', icon: FiSettings },
  { name: 'Transport', path: '/fpo/transport', icon: FiTruck },
];

const buyerLinks = [
  { name: 'Dashboard', path: '/buyer/dashboard', icon: FiHome },
  { name: 'Available Lots', path: '/buyer/lots', icon: FiPackage },
  { name: 'My Orders', path: '/buyer/orders', icon: FiShoppingCart },
  { name: 'Track Shipments', path: '/buyer/tracking', icon: FiTruck },
];

const FiBox = FiPackage; // Alias for simplicity
const FiShoppingCart = FiPackage;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let links = [];
  if (user?.role === 'farmer') links = farmerLinks;
  if (['fpo_admin', 'fpo_worker'].includes(user?.role)) links = fpoLinks;
  if (user?.role === 'buyer') links = buyerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary-800 text-white transition duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 bg-primary-900">
          <span className="text-2xl font-bold text-white">🌾 CROP2GO</span>
        </div>
        <nav className="mt-5 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive ? 'bg-primary-900 text-white' : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  }`
                }
              >
                <Icon className="mr-4 h-6 w-6" aria-hidden="true" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="flex justify-between items-center py-4 px-6 bg-white border-b-4 border-primary-500">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none lg:hidden">
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Hello, {user?.name || 'User'}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center">
              <FiLogOut className="mr-1 h-5 w-5" /> Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
""",
    "components/StatCard.jsx": """import React from 'react';

const StatCard = ({ icon: Icon, title, value, subtitle, colorClass }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colorClass.replace('border-', 'bg-').replace('-500', '-100')} ${colorClass.replace('border-', 'text-')}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
""",
    "components/DataTable.jsx": """import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const DataTable = ({ columns, data, searchable = false, actions }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((row) =>
    Object.values(row).some(
      (val) => String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.accessor ? row[col.accessor] : col.render(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
""",
    "components/Modal.jsx": """import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
""",
    "components/StatusBadge.jsx": """import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeStyle(status)}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export default StatusBadge;
"""
}

for filepath, content in files.items():
    full_path = os.path.join(BASE_DIR, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Components generated successfully.")
