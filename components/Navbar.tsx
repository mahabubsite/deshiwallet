
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { useAuth } from '../App';
import { auth, db } from '../firebase';
import { UserRole } from '../types';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

const { NavLink, useNavigate } = Router as any;

const Navbar: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    }, (error) => {
      console.warn("Config listener error:", error);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !profile) {
      setHasUnread(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'global'])
    );

    const unsub = onSnapshot(q, (snap) => {
      const userJoinedAt = profile.createdAt?.seconds || 0;
      const unread = snap.docs.some(d => {
        const data = d.data();
        if (data.read === true) return false;
        
        // Respect join date for global notifications
        if (data.userId === 'global') {
          return (data.createdAt?.seconds || 0) >= userJoinedAt;
        }
        return true; // Unread user-specific notification
      });
      setHasUnread(unread);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Navbar Notifications error:", error);
      }
    });

    return unsub;
  }, [user, profile]);

  const handleSignOut = () => {
    auth.signOut();
    navigate('/login');
  };

  const isAdmin = profile?.role === UserRole.ADMIN;

  const navItems = [
    { to: '/', icon: 'fa-wallet', label: 'Wallet' },
    { to: '/documents', icon: 'fa-file-shield', label: 'Documents', key: 'vault' },
    { to: '/notifications', icon: 'fa-bell', label: 'Alerts', hasBadge: hasUnread },
    { to: '/settings', icon: 'fa-cog', label: 'Settings' },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (!item.key) return true;
    if (isAdmin) return true;
    if (!config) return true;
    return config.features[item.key] !== false;
  });

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-secondary border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-20 px-4 z-50 md:hidden">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: any) =>
              `flex flex-col items-center justify-center space-y-1 relative ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            <i className={`fas ${item.icon} text-xl`}></i>
            {item.hasBadge && (
              <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-secondary shadow-sm"></span>
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }: any) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary' : 'text-amber-500'
              }`
            }
          >
            <i className="fas fa-user-shield text-xl"></i>
            <span className="text-[10px] uppercase font-bold tracking-wider">Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-secondary border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <i className="fas fa-wallet text-xl"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Deshi<span className="text-primary">Wallet</span></span>
        </div>

        <div className="flex items-center space-x-8">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: any) =>
                `flex items-center space-x-2 font-medium transition-colors relative ${
                  isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                }`
              }
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.hasBadge && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-secondary shadow-sm"></span>
              )}
            </NavLink>
          ))}
          
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }: any) =>
                `flex items-center space-x-2 font-bold transition-colors ${
                  isActive ? 'text-amber-600' : 'text-amber-500 hover:text-amber-600'
                } px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl`
              }
            >
              <i className="fas fa-user-shield"></i>
              <span>Admin Portal</span>
            </NavLink>
          )}

          <button
            onClick={handleSignOut}
            className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>
    </>
  );
};

export default Navbar;
