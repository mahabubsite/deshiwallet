
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface Design {
  id: string;
  name: string;
  class: string;
  customCss?: string;
  active: boolean;
  accent?: string;
  isGlass?: boolean;
}

const AdminDesigns: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDesign, setNewDesign] = useState({
    name: '',
    class: 'bg-gradient-to-br from-indigo-600 to-blue-700',
    customCss: 'backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);',
    active: true,
    accent: 'text-white',
    isGlass: true
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cardDesigns'), (snap) => {
      setDesigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Design)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleStatus = async (designId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'cardDesigns', designId), { active: !current });
    } catch (e) {
      alert('Error updating status');
    }
  };

  const deleteDesign = async (designId: string) => {
    if (window.confirm('Purge this skin from the system?')) {
      try {
        await deleteDoc(doc(db, 'cardDesigns', designId));
      } catch (e) {
        alert('Error deleting design');
      }
    }
  };

  const handleAddDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'cardDesigns'), {
        ...newDesign,
        createdAt: serverTimestamp()
      });
      setShowAdd(false);
      setNewDesign({
        name: '',
        class: 'bg-gradient-to-br from-indigo-600 to-blue-700',
        customCss: 'backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);',
        active: true,
        accent: 'text-white',
        isGlass: true
      });
    } catch (e) {
      alert('Error adding design');
    }
  };

  const parseCustomCss = (cssString: string): React.CSSProperties => {
    if (!cssString) return {};
    const styleObj: any = {};
    const declarations = cssString.split(';').filter(d => d.trim() !== '');
    declarations.forEach(decl => {
      const splitIdx = decl.indexOf(':');
      if (splitIdx > -1) {
        const prop = decl.substring(0, splitIdx).trim();
        const val = decl.substring(splitIdx + 1).trim();
        const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styleObj[camelProp] = val;
      }
    });
    return styleObj;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="bg-white dark:bg-secondary p-5 md:p-10 rounded-[48px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Identity Registry</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Managed Asset Skin Catalog</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-full md:w-auto px-8 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center space-x-3 transition-all hover:scale-105 active:scale-95"
          >
            <i className="fas fa-microchip"></i>
            <span>Initialize Engine</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {designs.map(design => (
              <div key={design.id} className="bg-gray-50 dark:bg-dark/40 p-6 rounded-[40px] border border-gray-100 dark:border-gray-800 group hover:border-primary/30 transition-all flex flex-col h-full">
                <div 
                  className={`w-full aspect-[1.586/1] rounded-[24px] mb-6 shadow-2xl ${design.class} flex items-center justify-center relative overflow-hidden`}
                  style={parseCustomCss(design.customCss || '')}
                >
                   {design.isGlass && <div className="absolute inset-0 backdrop-blur-sm bg-white/5"></div>}
                   <div className="relative z-10 text-center opacity-30">
                      <span className={`font-black italic text-2xl tracking-tighter ${design.accent || 'text-white'}`}>REGISTRY</span>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="min-w-0 pr-4">
                    <h3 className="font-black text-sm text-gray-800 dark:text-white truncate uppercase tracking-tight">{design.name}</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{design.active ? 'System Online' : 'Offline'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleStatus(design.id, design.active)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${design.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}
                    >
                      <i className={`fas ${design.active ? 'fa-toggle-on' : 'fa-toggle-off'} text-lg`}></i>
                    </button>
                    <button 
                      onClick={() => deleteDesign(design.id)}
                      className="w-10 h-10 bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Identity Engine Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-secondary w-full max-w-6xl rounded-[56px] shadow-2xl my-auto overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 md:p-12 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Visual Identity Engine</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-1">Configure Premium Asset Skins</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="w-14 h-14 bg-gray-50 dark:bg-dark rounded-[24px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-all active:scale-90 border border-gray-100 dark:border-gray-800 shadow-sm">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleAddDesign} className="p-8 md:p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                
                {/* Inputs Column */}
                <div className="space-y-8">
                  <div className="grid gap-8">
                    {/* Name - Required */}
                    <div className="group border-l-4 border-primary/40 pl-6">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Theme Display Name <span className="text-primary">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Midnight Onyx"
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-all py-2"
                        value={newDesign.name}
                        onChange={e => setNewDesign({...newDesign, name: e.target.value})}
                      />
                    </div>

                    {/* Tailwind BG - Required */}
                    <div className="group border-l-4 border-primary/40 pl-6">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tailwind Classes (BG & Gradient) <span className="text-primary">*</span></label>
                      <input 
                        type="text" 
                        required
                        placeholder="bg-gradient-to-br from-gray-900 to-black"
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-mono text-sm focus:border-primary transition-all py-2"
                        value={newDesign.class}
                        onChange={e => setNewDesign({...newDesign, class: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Accent - Required */}
                      <div className="group border-l-4 border-primary/40 pl-6">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Accent (text-cyan-300) <span className="text-primary">*</span></label>
                        <input 
                          type="text"
                          required
                          placeholder="text-white"
                          className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-sm focus:border-primary transition-all py-2"
                          value={newDesign.accent}
                          onChange={e => setNewDesign({...newDesign, accent: e.target.value})}
                        />
                      </div>

                      {/* Glass Toggle - Required */}
                      <div className="group border-l-4 border-primary/40 pl-6 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Glass Overlay <span className="text-primary">*</span></span>
                           <button 
                            type="button"
                            onClick={() => setNewDesign({...newDesign, isGlass: !newDesign.isGlass})}
                            className={`w-14 h-8 rounded-full transition-all relative ${newDesign.isGlass ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300 dark:bg-gray-700'}`}
                           >
                             <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${newDesign.isGlass ? 'left-8' : 'left-1.5'}`}></div>
                           </button>
                        </div>
                      </div>
                    </div>

                    {/* Custom CSS - Optional */}
                    <div className="group border-l-4 border-gray-200 pl-6">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Glass + Blur Texture CSS <span className="text-gray-300">(Optional)</span></label>
                      <textarea 
                        rows={3}
                        placeholder="backdrop-filter: blur(10px); background: rgba(0,0,0,0.1);"
                        className="w-full bg-gray-50 dark:bg-dark p-6 rounded-[28px] border-none outline-none font-mono text-xs focus:ring-4 focus:ring-primary/5 transition-all resize-none leading-relaxed"
                        value={newDesign.customCss}
                        onChange={e => setNewDesign({...newDesign, customCss: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Column */}
                <div className="flex flex-col justify-center items-center">
                  <div className="w-full max-w-lg space-y-10 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Engine Output Stream</h3>
                    </div>
                    
                    <div className="relative group perspective-1000 w-full">
                       {/* Floating background blob */}
                       <div className={`absolute inset-0 blur-3xl opacity-20 scale-90 -z-10 ${newDesign.class}`}></div>
                       
                       <div 
                          className={`w-full aspect-[1.586/1] rounded-[48px] ${newDesign.class} flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-700 ease-out transform group-hover:scale-[1.02]`}
                          style={parseCustomCss(newDesign.customCss)}
                        >
                          {newDesign.isGlass && <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03]"></div>}
                          
                          <div className="relative z-20 text-center px-10">
                            <p className={`font-black italic text-4xl md:text-5xl tracking-tighter opacity-10 uppercase transition-colors ${newDesign.accent}`}>VAULT ASSET</p>
                            <div className="w-16 h-1 bg-white/10 mx-auto my-6 rounded-full overflow-hidden">
                               <div className="h-full bg-white/40 w-1/3 rounded-full animate-pulse"></div>
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.6em] opacity-40 ${newDesign.accent}`}>Production Node: {newDesign.name || 'Untitled'}</p>
                          </div>

                          {/* Tech Decorative Elements */}
                          <div className="absolute top-10 left-10 w-14 h-10 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-xl shadow-inner opacity-50 border border-white/10"></div>
                          <div className="absolute bottom-10 right-10 flex space-x-2 opacity-20">
                             {[1,2,3,4].map(i => <div key={i} className={`w-1 rounded-full ${newDesign.accent} bg-current`} style={{ height: `${i*5}px` }}></div>)}
                          </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50/50 dark:bg-dark/40 rounded-[32px] border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed">
                        Data Consistency Verification: This identity skin will be synchronized across the global registry upon publishing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-12 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-6 bg-gray-50 dark:bg-dark text-gray-400 font-black rounded-[28px] uppercase text-[10px] tracking-[0.3em] transition-all hover:text-gray-900 dark:hover:text-white">Abandon Session</button>
                <button type="submit" className="flex-[2.5] py-6 bg-primary text-white font-black rounded-[28px] shadow-[0_20px_50px_rgba(59,130,246,0.25)] uppercase text-[10px] tracking-[0.4em] active:scale-[0.98] transition-all hover:bg-blue-600">Sync Identity Skin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDesigns;
