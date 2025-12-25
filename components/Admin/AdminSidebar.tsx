
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const { NavLink, useNavigate } = Router as any;

const AdminSidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    verifications: 0,
    reports: 0,
    deletions: 0,
    alerts: 0
  });

  useEffect(() => {
    const unsubVerif = onSnapshot(query(collection(db, 'verificationRequests'), where('status', '==', 'pending')), (snap) => {
      setCounts(prev => ({ ...prev, verifications: snap.size }));
    });
    const unsubReports = onSnapshot(query(collection(db, 'feedback'), where('status', '==', 'unread')), (snap) => {
      setCounts(prev => ({ ...prev, reports: snap.size }));
    });
    const unsubDeletions = onSnapshot(collection(db, 'deletionRequests'), (snap) => {
      setCounts(prev => ({ ...prev, deletions: snap.size }));
    });
    const unsubAlerts = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', 'admin_alert'), where('read', '==', false)), (snap) => {
      setCounts(prev => ({ ...prev, alerts: snap.size }));
    });

    return () => { unsubVerif(); unsubReports(); unsubDeletions(); unsubAlerts(); };
  }, []);

  const menuItems = [
    { to: '/admin', icon: 'fa-chart-pie', label: 'Dashboard' },
    { to: '/admin/users', icon: 'fa-users', label: 'Users' },
    { to: '/admin/documents', icon: 'fa-file-invoice', label: 'Documents' },
    { to: '/admin/cards', icon: 'fa-credit-card', label: 'Cards' },
    { to: '/admin/verification', icon: 'fa-id-badge', label: 'Verification', badge: counts.verifications },
    { to: '/admin/notifications', icon: 'fa-bullhorn', label: 'Send Alerts', badge: counts.alerts },
    { to: '/admin/deletion', icon: 'fa-trash-alt', label: 'Deletion', badge: counts.deletions },
    { to: '/admin/designs', icon: 'fa-paint-brush', label: 'Designs' },
    { to: '/admin/reports', icon: 'fa-comment-dots', label: 'Reports', badge: counts.reports },
    { to: '/admin/settings', icon: 'fa-sliders-h', label: 'Settings' },
  ];

  return (
    <aside className="flex flex-col w-64 bg-white dark:bg-secondary border-r border-gray-100 dark:border-gray-800 h-screen overflow-y-auto p-6 scrollbar-hide">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <i className="fas fa-layer-group"></i>
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">FinManage</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">System Menu</p>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => onClose?.()}
            className={({ isActive }: any) =>
              `flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 font-medium group ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark/50'
              }`
            }
          >
            <div className="flex items-center space-x-4">
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="text-sm">{item.label}</span>
            </div>
            {item.badge && item.badge > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm animate-pulse">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <button 
          onClick={() => { auth.signOut(); navigate('/login'); }}
          className="w-full flex items-center space-x-4 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all mt-4"
        >
          <i className="fas fa-sign-out-alt w-5"></i>
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
