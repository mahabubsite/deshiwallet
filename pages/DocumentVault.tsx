
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { VaultDocument } from '../types';

const { useNavigate } = Router as any;

const CATEGORY_ICONS: Record<string, string> = {
  'Passport': 'fa-passport', 'NID': 'fa-id-card', 'Driving License': 'fa-id-badge',
  'Health Insurance': 'fa-file-medical', 'Medical Card': 'fa-hospital-user',
  'Passwords': 'fa-key', 'Others': 'fa-file-shield'
};

const DocumentVault: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'documents'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VaultDocument)));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (window.confirm("Purge this artifact?")) await deleteDoc(doc(db, 'documents', docId));
  };

  const filteredDocs = filter === 'All' ? documents : documents.filter(d => d.category === filter);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-10 max-w-4xl mx-auto lg:max-w-full">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Documents</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Secure Your documents</p>
        </div>
        <button onClick={() => navigate('/add-document')} className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div className="max-w-4xl mx-auto lg:max-w-full mb-10 flex space-x-2 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800">
        {['All', ...Object.keys(CATEGORY_ICONS)].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${filter === cat ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {cat === 'All' ? 'Archives' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-secondary rounded-3xl border border-gray-100 dark:border-gray-800 max-w-4xl mx-auto lg:max-w-full shadow-sm">
           <div className="w-16 h-16 bg-gray-50 dark:bg-dark rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200">
             <i className="fas fa-file-shield text-2xl"></i>
           </div>
           <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No Documents Found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocs.map(docItem => (
            <div 
              key={docItem.id} 
              onClick={() => navigate(`/document/${docItem.id}`)} 
              className="bg-white dark:bg-secondary p-5 rounded-2xl cursor-pointer group hover:shadow-lg hover:border-primary/20 border border-gray-50 dark:border-gray-800 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-dark rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <i className={`fas ${CATEGORY_ICONS[docItem.category] || 'fa-file-shield'} text-lg`}></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm uppercase tracking-tight text-gray-800 dark:text-gray-100 leading-none mb-1 truncate">{docItem.title}</h3>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{docItem.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-document/${docItem.id}`); }} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-primary transition-colors"><i className="fas fa-edit text-[10px]"></i></button>
                   <button onClick={(e) => handleDelete(e, docItem.id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[10px]"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
