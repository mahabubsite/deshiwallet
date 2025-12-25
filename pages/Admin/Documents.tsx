
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { VaultDocument } from '../../types';

const AdminDocuments: React.FC = () => {
  const [docs, setDocs] = useState<(VaultDocument & { ownerName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'documents'), async (snap) => {
      const docList = await Promise.all(snap.docs.map(async d => {
        const data = d.data() as VaultDocument;
        const userRef = doc(db, 'users', data.userId);
        const userSnap = await getDoc(userRef);
        return { id: d.id, ...data, ownerName: userSnap.exists() ? userSnap.data().fullName : 'Unknown' };
      }));
      setDocs(docList);
      setLoading(false);
    });
    return unsub;
  }, []);

  const categories = ['All', ...new Set(docs.map(d => d.category))];

  const filtered = docs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                         d.ownerName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-2xl font-black">Asset Inventory</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Platform-wide encrypted artifacts: <span className="text-primary font-black">{docs.length}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-80">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                type="text" 
                placeholder="Find document or owner..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark rounded-2xl outline-none text-sm font-bold shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-gray-50 dark:bg-dark px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(d => (
              <div key={d.id} className="bg-gray-50 dark:bg-dark/40 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 hover:border-primary group transition-all">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-white dark:bg-secondary rounded-[24px] flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                    <i className="fas fa-file-shield text-xl"></i>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedDoc(d)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-primary transition-colors">
                      <i className="fas fa-eye text-xs"></i>
                    </button>
                    <button onClick={async () => { if(window.confirm('Erase this document from system?')) await deleteDoc(doc(db, 'documents', d.id)); }} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white truncate mb-1">{d.title}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">{d.category}</p>
                
                <div className="flex items-center space-x-3 mb-6">
                   <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-dark flex items-center justify-center text-[8px] font-black">{d.ownerName?.charAt(0)}</div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Owner: {d.ownerName}</p>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800/50">
                  <button onClick={() => setSelectedDoc(d)} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Full Manifest</button>
                  <span className="text-[9px] font-bold text-gray-300 uppercase">{d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Manifest Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center px-4">
          <div className="bg-white dark:bg-secondary w-full max-w-2xl rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <i className="fas fa-file-invoice"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black">{selectedDoc.title}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedDoc.category} Content</p>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="w-12 h-12 bg-gray-50 dark:bg-dark rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"><i className="fas fa-times"></i></button>
            </div>

            <div className="space-y-8">
               <div className="bg-gray-50 dark:bg-dark p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 space-y-6">
                  {selectedDoc.metadata && Object.entries(selectedDoc.metadata).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 last:border-none pb-4">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key}</span>
                       <span className="text-sm font-bold tracking-tight">{val}</span>
                    </div>
                  ))}
               </div>
               {selectedDoc.notes && (
                 <div className="p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[32px]">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3">System Notes & Remarks</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">"{selectedDoc.notes}"</p>
                 </div>
               )}
            </div>

            <div className="flex space-x-4 mt-12">
              <button onClick={() => setSelectedDoc(null)} className="flex-1 py-5 bg-gray-50 dark:bg-dark text-gray-400 font-black rounded-3xl uppercase text-[10px] tracking-widest">Dismiss Audit</button>
              <button className="flex-[1.5] py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/25 uppercase text-[10px] tracking-widest">Verify Authenticity</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;
