
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface Design {
  id: string;
  name: string;
  class: string;
  active: boolean;
  secondary?: string;
  accent?: string;
  isGlass?: boolean;
}

const AdminDesigns: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDesign, setNewDesign] = useState({
    name: '',
    class: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    active: true,
    secondary: '',
    accent: '',
    isGlass: false
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
      alert('Error updating design status');
    }
  };

  const deleteDesign = async (designId: string) => {
    if (window.confirm('Are you sure you want to delete this design theme?')) {
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
        class: 'bg-gradient-to-br from-blue-600 to-indigo-700',
        active: true,
        secondary: '',
        accent: '',
        isGlass: false
      });
    } catch (e) {
      alert('Error adding design');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black">Theme Customization</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage global card appearance themes</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
          >
            <i className="fas fa-plus"></i>
            <span>Create New Theme</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map(design => (
              <div key={design.id} className="bg-gray-50 dark:bg-dark/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 group hover:border-primary/30 transition-all">
                <div className={`w-full aspect-[1.6/1] rounded-2xl mb-4 shadow-lg ${design.class} flex items-center justify-center relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <span className="text-white/20 font-black italic text-3xl tracking-tighter">PREVIEW</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white">{design.name}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${design.active ? 'text-green-500' : 'text-gray-400'}`}>
                      {design.active ? 'System Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleStatus(design.id, design.active)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${design.active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}
                      title={design.active ? "Deactivate Theme" : "Activate Theme"}
                    >
                      <i className={`fas ${design.active ? 'fa-toggle-on' : 'fa-toggle-off'} text-lg`}></i>
                    </button>
                    <button 
                      onClick={() => deleteDesign(design.id)}
                      className="w-10 h-10 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
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

      {/* Add Design Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white dark:bg-secondary w-full max-w-xl rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">Add New Theme</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom CSS Classes Required</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="w-10 h-10 bg-gray-50 dark:bg-dark rounded-xl flex items-center justify-center text-gray-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddDesign} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Theme Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Midnight Cyber"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm"
                  value={newDesign.name}
                  onChange={e => setNewDesign({...newDesign, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tailwind Classes (BG & Gradient)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. bg-gradient-to-br from-blue-600 to-black"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm"
                  value={newDesign.class}
                  onChange={e => setNewDesign({...newDesign, class: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Accent Color (Text)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. text-cyan-400"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm"
                    value={newDesign.accent}
                    onChange={e => setNewDesign({...newDesign, accent: e.target.value})}
                  />
                </div>
                <div className="flex items-center pt-6 space-x-3">
                   <button 
                    type="button"
                    onClick={() => setNewDesign({...newDesign, isGlass: !newDesign.isGlass})}
                    className={`w-12 h-6 rounded-full transition-all relative ${newDesign.isGlass ? 'bg-primary' : 'bg-gray-200'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${newDesign.isGlass ? 'left-7' : 'left-1'}`}></div>
                   </button>
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Glassmorphism</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Preview Component</p>
                <div className={`w-full aspect-[2/1] rounded-2xl ${newDesign.class} flex items-center justify-center`}>
                  <span className={`font-black italic text-xl ${newDesign.accent || 'text-white/20'}`}>CARD PREVIEW</span>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-gray-100 dark:bg-dark text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase text-[10px] tracking-widest">Publish Theme</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDesigns;
