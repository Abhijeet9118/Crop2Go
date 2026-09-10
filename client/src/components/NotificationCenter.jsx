import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FiBell, FiX, FiCheck, FiDollarSign, FiTruck, FiAlertTriangle, 
  FiTrendingUp, FiCloudRain, FiBox, FiCheckCircle, FiChevronRight,
  FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const DEFAULT_NOTIFICATIONS = {
  farmer: [
    {
      id: 'f1',
      title: 'Payment Credited: ₹1,10,032',
      message: 'Direct IMPS payout for 3,200 kg Tomato (Lot #TOM-0908) successfully deposited in your Bank of Baroda account.',
      type: 'payment',
      icon: FiDollarSign,
      color: 'emerald',
      time: '12m ago',
      read: false,
      link: '/farmer/payments'
    },
    {
      id: 'f2',
      title: 'Cold-Chain Truck Dispatched',
      message: 'Reefer Truck MH 12 AB 9021 has departed Kisaan Sahyog FPO with your tomato harvest towards Vashi APMC Mumbai.',
      type: 'logistics',
      icon: FiTruck,
      color: 'blue',
      time: '45m ago',
      read: false,
      link: '/farmer/produce'
    },
    {
      id: 'f3',
      title: 'Azadpur Mandi Rate Spike (+12%)',
      message: 'Modal tomato price jumped to ₹42/kg at Azadpur Mandi Delhi. FPO contract procurement rate is ₹40/kg.',
      type: 'market',
      icon: FiTrendingUp,
      color: 'purple',
      time: '2h ago',
      read: false,
      link: '/farmer/mandi-prices'
    },
    {
      id: 'f4',
      title: 'Weather Forecast Alert',
      message: 'Nashik region expects clear skies (28°C, humidity 62%) over the next 48h. Ideal window for tomato harvesting.',
      type: 'weather',
      icon: FiCloudRain,
      color: 'sky',
      time: '4h ago',
      read: true,
      link: '/farmer/weather'
    },
    {
      id: 'f5',
      title: 'AI Quality Grading Passed (81.25% Grade-A)',
      message: 'Computer Vision analysis for Lot #TOM-0908 completed with zero fungal blemishes. Certified for B2B institutional export.',
      type: 'quality',
      icon: FiCheckCircle,
      color: 'green',
      time: '1d ago',
      read: true,
      link: '/farmer/produce'
    }
  ],
  fpo_admin: [
    {
      id: 'a1',
      title: 'Perishable Aging Alert: Master Lot 0908',
      message: '12,250 kg Tomato in Cold Room 2 has been stored for 36 hours. Prompt dispatch advised to minimize loss.',
      type: 'warning',
      icon: FiAlertTriangle,
      color: 'amber',
      time: '15m ago',
      read: false,
      link: '/fpo/ai-engine'
    },
    {
      id: 'a2',
      title: 'Institutional Order Confirmed: 12,000 kg',
      message: 'Reliance Fresh confirmed purchase order #ORD-0908-01 for 12,000 kg Grade-A Nashik Tomatoes at ₹40/kg.',
      type: 'order',
      icon: FiBox,
      color: 'blue',
      time: '1h ago',
      read: false,
      link: '/fpo/buyers'
    },
    {
      id: 'a3',
      title: 'Reefer Truck GPS Telemetry Steady',
      message: 'Truck MH 12 AB 9021 passed Igatpuri on NH 160 at 48 km/h. Reefer container temperature normal at 12°C.',
      type: 'logistics',
      icon: FiTruck,
      color: 'emerald',
      time: '2h ago',
      read: false,
      link: '/fpo/dispatch'
    },
    {
      id: 'a4',
      title: 'High Farmer Arrival Volume (+24%)',
      message: 'Collection Centre A recorded 15,400 kg arrivals today. Electronic scale weighing capacity at 85% utilization.',
      type: 'ops',
      icon: FiTrendingUp,
      color: 'indigo',
      time: '3h ago',
      read: true,
      link: '/fpo/collection'
    },
    {
      id: 'a5',
      title: 'Farmer Payout Batch #DISB-0908 Settled',
      message: '₹4,20,500 successfully distributed to 5 contributing farmers based on verified master lot grading weights.',
      type: 'finance',
      icon: FiDollarSign,
      color: 'green',
      time: '5h ago',
      read: true,
      link: '/fpo/payments'
    }
  ],
  fpo_worker: [
    {
      id: 'w1',
      title: 'Weighing Queue: 4 Lots Pending',
      message: 'Four tractor trolleys arrived at Collection Centre A awaiting electronic weighbridge entry.',
      type: 'ops',
      icon: FiBox,
      color: 'indigo',
      time: '10m ago',
      read: false,
      link: '/fpo/weighing'
    },
    {
      id: 'w2',
      title: 'AI Computer Vision Camera Ready',
      message: 'AI grading conveyor belt calibrated for tomato batch scanning at Collection Centre B.',
      type: 'quality',
      icon: FiCheckCircle,
      color: 'green',
      time: '30m ago',
      read: false,
      link: '/fpo/grading'
    }
  ],
  transporter: [
    {
      id: 't1',
      title: 'Active Trip Route: Vashi APMC Mumbai',
      message: 'Destination geofence active. 142 km remaining from Nashik Hub. Estimated Arrival: 4.5 hours.',
      type: 'route',
      icon: FiMapPinIcon,
      color: 'emerald',
      time: '18m ago',
      read: false,
      link: '/transport'
    },
    {
      id: 't2',
      title: 'Reefer Sensor Telemetry Normal (12°C)',
      message: 'Cold chain temperature and humidity steady within FSSAI safe perishable range.',
      type: 'iot',
      icon: FiTruck,
      color: 'blue',
      time: '1h ago',
      read: false,
      link: '/transport'
    },
    {
      id: 't3',
      title: 'E-Way Bill #9821-EWAY Validated',
      message: 'Digital transit clearance verified for toll plazas on Mumbai-Pune Expressway.',
      type: 'compliance',
      icon: FiCheckCircle,
      color: 'green',
      time: '2h ago',
      read: true,
      link: '/transport?tab=dispatches'
    }
  ],
  driver: [
    {
      id: 'd1',
      title: 'Active Trip Route: Vashi APMC Mumbai',
      message: 'Destination geofence active. 142 km remaining from Nashik Hub. Estimated Arrival: 4.5 hours.',
      type: 'route',
      icon: FiTruck,
      color: 'emerald',
      time: '18m ago',
      read: false,
      link: '/transport'
    },
    {
      id: 'd2',
      title: 'Live GPS Transmitter Broadcasting',
      message: 'Your browser is currently transmitting real-time coordinates to the FPO dispatch monitoring screen.',
      type: 'iot',
      icon: FiCheckCircle,
      color: 'blue',
      time: '35m ago',
      read: false,
      link: '/transport'
    }
  ],
  buyer: [
    {
      id: 'b1',
      title: 'Order ORD-0908-01 In Transit',
      message: 'Reefer Truck MH 12 AB 9021 carrying 12,000 kg Grade-A Nashik Tomatoes is on route to Vashi Distribution Hub.',
      type: 'delivery',
      icon: FiTruck,
      color: 'blue',
      time: '25m ago',
      read: false,
      link: '/buyer/tracking'
    },
    {
      id: 'b2',
      title: 'Agmark Grade-A Certificate Ready',
      message: 'Quality inspection certificate for Master Lot #MASTER-TOM-0908 is ready for download.',
      type: 'quality',
      icon: FiCheckCircle,
      color: 'green',
      time: '1h ago',
      read: false,
      link: '/buyer/orders'
    },
    {
      id: 'b3',
      title: 'Tax Invoice Generated: ₹4,80,000',
      message: 'Invoice #INV-0908 generated. Payment terms: 7 days net bank transfer.',
      type: 'finance',
      icon: FiDollarSign,
      color: 'emerald',
      time: '3h ago',
      read: true,
      link: '/buyer/orders'
    }
  ]
};

function FiMapPinIcon(props) {
  return <FiTruck {...props} />;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread'
  const dropdownRef = useRef(null);

  // Initialize notifications based on user role
  const roleKey = user?.role || 'farmer';
  const [notifications, setNotifications] = useState(() => {
    return DEFAULT_NOTIFICATIONS[roleKey] || DEFAULT_NOTIFICATIONS.farmer;
  });

  // Re-sync notifications when role changes
  useEffect(() => {
    if (user?.role) {
      setNotifications(DEFAULT_NOTIFICATIONS[user.role] || DEFAULT_NOTIFICATIONS.farmer);
    }
  }, [user?.role]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const clearAll = () => {
    setNotifications([]);
    toast('Notifications cleared', { icon: '🗑️' });
  };

  const handleNotificationClick = (notif) => {
    // Mark this notification as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg relative transition-all ${
          isOpen ? 'bg-primary-100 text-primary-800' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        }`}
        title="Notifications &amp; Alerts"
        aria-label="Open Notifications"
      >
        <FiBell className="w-5 h-5" />

        {/* Pulsing indicator badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-primary-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="w-4 h-4 text-emerald-300" />
              <span className="font-bold text-sm">{t('notif_title', 'Notifications')}</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} {t('notif_new', 'new')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-emerald-200 hover:text-white font-medium hover:underline px-1.5 py-0.5 rounded"
                  title="Mark all as read"
                >
                  {t('notif_mark_read', 'Mark all read')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t('notif_all', 'All')} ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeFilter === 'unread'
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t('notif_unread', 'Unread')} ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] text-gray-400 hover:text-red-600 font-medium flex items-center gap-1"
                title="Clear all notifications"
              >
                <FiTrash2 className="w-3 h-3" /> {t('notif_clear', 'Clear')}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <FiCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs font-semibold text-gray-600">{t('notif_no_new', 'No new notifications')}</p>
                <p className="text-[11px] text-gray-400">{t('notif_caught_up', 'You are all caught up!')}</p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const IconComponent = notif.icon || FiBell;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-primary-50/60 group ${
                      !notif.read ? 'bg-emerald-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Notification Icon */}
                    <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                      notif.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                      notif.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      notif.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                      notif.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                      notif.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                      notif.color === 'green' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs leading-snug truncate ${
                          !notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                        }`}>
                          {t(`notif_${notif.id}_title`, notif.title)}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                        {t(`notif_${notif.id}_msg`, notif.message)}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {notif.time}
                        </span>
                        <span className="text-[10px] text-primary-700 group-hover:text-primary-900 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('notif_view_details', 'View details')} <FiChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-center">
            <span className="text-[10px] text-gray-500">
              {t('common_role', 'Role:')} <strong className="capitalize text-primary-800">{user?.role?.replace(/_/g, ' ') || t('common_farmer', 'Farmer')}</strong> &bull; {t('notif_telemetry', 'Live Telemetry Feed')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
