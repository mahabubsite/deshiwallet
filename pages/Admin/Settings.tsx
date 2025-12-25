
import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface CustomPage {
  id: string;
  title: string;
  icon: string;
  content: string;
  active: boolean;
}

interface SystemConfig {
  features: Record<string, boolean>;
  content: Record<string, string>;
  customPages: CustomPage[];
  appMaintenance: boolean;
  minAppVersion: string;
  currentAppVersion: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  features: {
    privacy: true,
    help: true,
    terms: true,
    pin: true,
    language: true,
    vault: true,
    addCard: true,
    report: true,
    profile: true,
    about: true
  },
  content: {
    about: `<div class="space-y-4 text-center">
      <p class="text-primary font-black">DESHI WALLET v1.3.0</p>
      <p>Deshi Wallet is a next-generation encrypted storage solution designed to provide elite security for your digital identity and financial assets.</p>
    </div>`,
    privacy: `<h2 class="text-lg font-black text-primary">Data Protection Policy</h2><p>Your data is secured using AES-256 bit encryption.</p>`,
    helpHeader: "Our premium support team is available 24/7.",
    faq: `<h4 class="font-bold text-primary">How do I add a new card?</h4><p>Go to the Home screen and click the '+' button.</p>`,
    terms: "By accessing Deshi Wallet, you agree to be bound by these Terms of Service."
  },
  customPages: [],
  appMaintenance: false,
  minAppVersion: '1.3.0',
  currentAppVersion: '1.3.0'
};

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'toggles' | 'system-pages' | 'custom-pages' | 'version'>('toggles');
  
  // New Page State
  const [showAddPage, setShowAddPage] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [newPage, setNewPage] = useState({ title: '', icon: 'fa-file-alt', content: '' });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          features: { ...DEFAULT_CONFIG.features, ...(data.features || {}) },
          content: { ...DEFAULT_CONFIG.content, ...(data.content || {}) },
          customPages: data.customPages || []
        });
      } else {
        setDoc(doc(db, 'systemConfig', 'main'), DEFAULT_CONFIG);
        setConfig(DEFAULT_CONFIG);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const saveConfig = async (newConfig: SystemConfig) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'systemConfig', 'main'), newConfig);
    } catch (e) {
      alert('Error updating configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: string) => {
    if (!config) return;
    const newConfig = { ...config, features: { ...config.features, [key]: !config.features[key] } };
    saveConfig(newConfig);
  };

  const handleAddCustomPage = () => {
    if (!config || !newPage.title) return;
    const page: CustomPage = {
      id: `page_${Date.now()}`,
      title: newPage.title,
      icon: newPage.icon,
      content: newPage.content,
      active: true
    };
    const newConfig = { ...config, customPages: [...config.customPages, page] };
    saveConfig(newConfig);
    setShowAddPage(false);
    setNewPage({ title: '', icon: 'fa-file-alt', content: '' });
  };

  const handleUpdateCustomPage = () => {
    if (!config || !editingPage) return;
    const newPages = config.customPages.map(p => p.id === editingPage.id ? editingPage : p);
    saveConfig({ ...config, customPages: newPages });
    setEditingPage(null);
  };

  const deleteCustomPage = (id: string) => {
    if (!config || !window.confirm('Delete this custom page?')) return;
    saveConfig({ ...config, customPages: config.customPages.filter(p => p.id !== id) });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const featureLabels: Record<string, string> = {
    privacy: 'Privacy Center Page',
    help: 'Help Center Access',
    terms: 'Terms & Conditions',
    pin: 'App PIN Protection',
    language: 'Language Selection',
    vault: 'Documents Module',
    addCard: 'New Card Entry',
    report: 'Report Issue Form',
    profile: 'Profile Management',
    about: 'About App Page'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black">Platform Settings</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Modules, Custom Pages & Version Control</p>
          </div>
          {saving && <div className="text-primary text-[10px] font-black animate-pulse">SYNCING...</div>}
        </div>

        <div className="flex space-x-1 bg-gray-50 dark:bg-dark p-1 rounded-2xl mb-10 overflow-x-auto no-scrollbar border border-gray-100 dark:border-gray-800">
          {(['toggles', 'system-pages', 'custom-pages', 'version'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white dark:bg-secondary text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab === 'toggles' ? 'Visibility' : tab === 'system-pages' ? 'System Pages' : tab === 'custom-pages' ? 'Custom Pages' : 'Versions'}
            </button>
          ))}
        </div>

        {activeTab === 'toggles' && config && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(DEFAULT_CONFIG.features).map((key) => (
              <div key={key} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-dark/50 rounded-[32px] border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                   <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">{featureLabels[key] || key}</span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{config.features[key] ? 'Visible' : 'Hidden'}</span>
                </div>
                <button 
                  onClick={() => toggleFeature(key)}
                  className={`w-12 h-6 rounded-full transition-all relative ${config.features[key] ? 'bg-primary shadow-lg' : 'bg-gray-200 dark:bg-dark'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.features[key] ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'custom-pages' && config && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Manage Custom Pages</h3>
               <button onClick={() => setShowAddPage(true)} className="px-6 py-3 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest">+ Add New Page</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.customPages.map(page => (
                <div key={page.id} className="bg-gray-50 dark:bg-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800">
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <i className={`fas ${page.icon}`}></i>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => setEditingPage(page)} className="text-gray-400 hover:text-primary"><i className="fas fa-edit"></i></button>
                        <button onClick={() => deleteCustomPage(page.id)} className="text-gray-400 hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
                      </div>
                   </div>
                   <h4 className="font-bold text-sm mb-1">{page.title}</h4>
                   <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">URL: /settings/page/{page.id}</p>
                </div>
              ))}
              {config.customPages.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[32px]">No custom pages created yet</div>
              )}
            </div>
          </div>
        )}

        {/* System Pages Content Editor (Help, Privacy, etc.) */}
        {activeTab === 'system-pages' && config && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Edit System Pages</h3>
                  {['about', 'privacy', 'faq', 'terms'].map(contentKey => (
                    <div key={contentKey} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{contentKey}</label>
                      <textarea 
                        className="w-full min-h-[150px] p-6 bg-gray-50 dark:bg-dark rounded-3xl font-mono text-xs focus:ring-4 focus:ring-primary/5"
                        value={config.content[contentKey] || ''}
                        onChange={(e) => setConfig({...config, content: {...config.content, [contentKey]: e.target.value}})}
                      />
                    </div>
                  ))}
                  <button onClick={() => saveConfig(config)} className="w-full py-5 bg-primary text-white font-black rounded-3xl uppercase tracking-widest shadow-xl">Update System Content</button>
               </div>
               <div className="p-8 bg-gray-50 dark:bg-dark rounded-[40px] border border-gray-100 dark:border-gray-800 overflow-y-auto no-scrollbar max-h-[800px]">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Live Preview (About)</h3>
                  <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: config.content.about }} />
               </div>
             </div>
          </div>
        )}

        {activeTab === 'version' && config && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-primary/5 rounded-[40px] border border-primary/10 space-y-6">
                 <h3 className="text-sm font-black text-primary uppercase tracking-widest">Version Control</h3>
                 <div className="space-y-4">
                    <input type="text" className="w-full p-4 bg-white dark:bg-dark rounded-2xl font-bold" value={config.currentAppVersion} onChange={e => setConfig({...config, currentAppVersion: e.target.value})} />
                    <button onClick={() => saveConfig(config)} className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase text-[10px]">Sync Version</button>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Add/Edit Custom Page Modal */}
      {(showAddPage || editingPage) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center px-4">
          <div className="bg-white dark:bg-secondary w-full max-w-4xl rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6">{editingPage ? 'Edit Page' : 'Create Custom Page'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Page Title</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 dark:bg-dark rounded-2xl font-bold"
                  value={editingPage ? editingPage.title : newPage.title}
                  onChange={e => editingPage ? setEditingPage({...editingPage, title: e.target.value}) : setNewPage({...newPage, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">FontAwesome Icon</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 dark:bg-dark rounded-2xl font-bold"
                  value={editingPage ? editingPage.icon : newPage.icon}
                  onChange={e => editingPage ? setEditingPage({...editingPage, icon: e.target.value}) : setNewPage({...newPage, icon: e.target.value})}
                />
              </div>
            </div>
            <div className="mb-8">
               <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">HTML Content</label>
               <textarea 
                  className="w-full min-h-[300px] p-6 bg-gray-50 dark:bg-dark rounded-[32px] font-mono text-xs focus:ring-4 focus:ring-primary/5"
                  value={editingPage ? editingPage.content : newPage.content}
                  onChange={e => editingPage ? setEditingPage({...editingPage, content: e.target.value}) : setNewPage({...newPage, content: e.target.value})}
               />
            </div>
            <div className="flex space-x-4">
              <button onClick={() => { setShowAddPage(false); setEditingPage(null); }} className="flex-1 py-5 bg-gray-100 text-gray-400 font-black rounded-3xl uppercase text-[10px]">Cancel</button>
              <button onClick={editingPage ? handleUpdateCustomPage : handleAddCustomPage} className="flex-[2] py-5 bg-primary text-white font-black rounded-3xl uppercase text-[10px] shadow-xl">
                 {editingPage ? 'Save Changes' : 'Publish New Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
