
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { useAuth, useInstall } from '../App';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc } from 'firebase/firestore';

const { useNavigate, Link } = Router as any;

const Settings: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { isInstallable, installApp } = useInstall();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, []);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const togglePinProtection = async () => {
    if (!user) return;
    const newVal = !profile?.pinProtectionEnabled;
    if (newVal && !profile?.appPin) {
      alert("Please set a PIN first.");
      navigate('/settings/pin');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { pinProtectionEnabled: newVal });
      await refreshProfile();
    } catch (e) {
      alert("Failed to update protection status.");
    }
  };

  const handleRequestDeletion = async () => {
    if (!deleteReason.trim() || !user) return;
    setIsDeleting(true);
    try {
      await addDoc(collection(db, 'deletionRequests'), {
        userId: user.uid,
        userEmail: user.email,
        reason: deleteReason,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Account deletion request submitted for review.');
      setShowDeleteModal(false);
    } catch (err) {
      alert('Failed to submit request.');
    } finally {
      setIsDeleting(false);
    }
  };

  const sectionGroups = [
    {
      title: 'Profile & Identity',
      items: [
        { label: 'Manage Profile', icon: 'fa-user-gear', type: 'link', to: '/settings/profile', feature: 'profile' },
        { label: 'Verification Status', icon: 'fa-id-card-clip', type: 'link', to: '/settings/verification-status', feature: 'profile' }
      ]
    },
    {
      title: 'Security Engine',
      items: [
        { label: 'Biometric/PIN Lock', icon: 'fa-fingerprint', type: 'toggle', value: !!profile?.pinProtectionEnabled, action: togglePinProtection, feature: 'pin' },
        { label: 'Update Vault PIN', icon: 'fa-key', type: 'link', to: '/settings/pin', feature: 'pin' },
        { label: 'Change Password', icon: 'fa-shield-halved', type: 'link', to: '/settings/password' },
        { label: 'Privacy Center', icon: 'fa-user-shield', type: 'link', to: '/settings/privacy', feature: 'privacy' }
      ]
    },
    {
      title: 'System Preferences',
      items: [
        { label: 'DeshiWallet AI', icon: 'fa-robot', type: 'link', to: '/ai', color: 'text-primary' },
        { label: 'Dark Mode Appearance', icon: 'fa-moon', type: 'toggle', value: darkMode, action: toggleDarkMode },
        { label: 'Language Selection', icon: 'fa-language', type: 'link', value: 'English', to: '/settings/language', feature: 'language' },
        { label: 'Help & Documentation', icon: 'fa-circle-question', type: 'link', to: '/settings/help', feature: 'help' },
        { label: 'Report Platform Issue', icon: 'fa-bug', type: 'link', to: '/settings/report', feature: 'report' },
        { label: 'About Platform', icon: 'fa-circle-info', type: 'link', to: '/about', feature: 'about' }
      ]
    },
    {
      title: 'Custom Resources',
      items: (config?.customPages || [])
        .filter((p: any) => p.active !== false)
        .map((p: any) => ({
          label: p.title,
          icon: p.icon || 'fa-file-lines',
          type: 'link',
          to: `/settings/page/${p.id}`
        })),
      hidden: !config?.customPages?.filter((p: any) => p.active !== false).length
    }
  ];

  const filteredSections = sectionGroups.filter(g => !g.hidden).map(section => ({
    ...section,
    items: section.items.filter((item: any) => {
      if (!config?.features) return true;
      if (!item.feature) return true;
      return config.features[item.feature] !== false;
    })
  })).filter(section => section.items.length > 0);

  return (
    <div className="max-w-[1200px] mx-auto pb-24 lg:py-12 bg-white dark:bg-dark min-h-screen">
      {/* Banner Section - Simplified & Sharp */}
      <div className="bg-primary p-6 md:p-12 text-white flex flex-col md:flex-row items-center justify-between border-b-4 border-black/10">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 flex items-center justify-center text-3xl font-black border border-white/20">
            {profile?.fullName?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{profile?.fullName}</h2>
            <p className="text-xs opacity-70 font-bold uppercase tracking-widest">{profile?.email}</p>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4">
          <span className={`text-[10px] font-black uppercase px-4 py-2 border border-white/20 ${profile?.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            {profile?.status}
          </span>
          <button onClick={() => auth.signOut()} className="text-[10px] font-black uppercase px-6 py-2 bg-black text-white hover:bg-white hover:text-black transition-colors">Sign Out</button>
        </div>
      </div>

      <div className="p-4 md:p-10">
        {/* PWA Install Button */}
        {isInstallable && (
          <div className="mb-10 animate-in slide-in-from-top-4">
            <button 
              onClick={installApp}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-[32px] flex items-center justify-between shadow-xl shadow-emerald-500/20 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-download text-xl"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-tight">Install DeshiWallet App</h3>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Install for the best experience</p>
                </div>
              </div>
              <i className="fas fa-chevron-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
          {filteredSections.map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-secondary">
              <div className="px-6 py-4 bg-gray-50 dark:bg-dark/50 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{section.title}</h3>
              </div>
              <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
                {section.items.map((item: any, i) => (
                  <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-dark/20 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 flex items-center justify-center ${item.color || 'text-gray-400'} group-hover:text-primary transition-colors`}>
                        <i className={`fas ${item.icon} text-lg`}></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-tight">{item.label}</span>
                        {item.type === 'text' && <span className="text-[9px] font-black text-primary uppercase tracking-widest">{item.value}</span>}
                      </div>
                    </div>
                    {item.type === 'toggle' ? (
                      <button onClick={item.action} className={`w-12 h-6 transition-all relative border-2 ${item.value ? 'bg-primary border-primary' : 'bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${item.value ? 'left-7' : 'left-0.5'}`}></div>
                      </button>
                    ) : item.type === 'link' ? (
                      <Link to={item.to} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-primary">
                        <i className="fas fa-chevron-right text-xs"></i>
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 group">
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-dark/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-[18px] shadow-sm transition-all hover:border-primary/20">
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="absolute w-4 h-4 bg-emerald-500/30 rounded-full animate-ping"></div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Core Engine</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase tracking-tight">
                      {config?.currentAppVersion || 'v1.3.5'}
                    </span>
                    <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-widest">Stable</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] sm:mt-0 mt-2">Production Environment Active</p>
            </div>
            
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:text-red-600 transition-colors border-b border-transparent hover:border-red-500 pb-0.5"
            >
              Account Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-secondary w-full max-w-lg p-10 border-t-8 border-red-500 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-2 text-gray-900 dark:text-white">Account Deletion</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">
              WARNING: CLOSING YOUR ACCOUNT IS PERMANENT. ALL ENCRYPTED CARDS, DOCUMENTS, AND PROFILE DATA WILL BE WIPED FROM OUR SERVERS UPON APPROVAL.
            </p>
            <textarea 
              className="w-full p-4 bg-gray-50 dark:bg-dark border-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-sm min-h-[120px] mb-8 focus:border-red-500 text-gray-800 dark:text-gray-200" 
              placeholder="Reason for account deletion (Required)..." 
              value={deleteReason} 
              onChange={(e) => setDeleteReason(e.target.value)}
            ></textarea>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-dark text-gray-500 font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleRequestDeletion} disabled={!deleteReason.trim() || isDeleting} className="flex-1 py-4 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                {isDeleting ? 'PROCESSING...' : 'CONFIRM DELETION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
