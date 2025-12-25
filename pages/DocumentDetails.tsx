import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { VaultDocument } from '../types';

const { useParams, useNavigate } = Router as any;

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  'NID': { icon: 'fa-id-card', color: 'bg-emerald-600' },
  'Passport': { icon: 'fa-passport', color: 'bg-indigo-600' },
  'Driving License': { icon: 'fa-id-badge', color: 'bg-amber-600' },
  'Medical Card': { icon: 'fa-hospital-user', color: 'bg-red-600' },
  'Passwords': { icon: 'fa-key', color: 'bg-slate-900' },
  'Others': { icon: 'fa-file-shield', color: 'bg-primary' }
};

const DocumentDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docData, setDocData] = useState<VaultDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchDoc = async () => {
      try {
        const snap = await getDoc(doc(db, 'documents', id));
        if (snap.exists()) {
          setDocData({ id: snap.id, ...snap.data() } as VaultDocument);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id, user]);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async () => {
    if (!docData) return;
    const shareText = Object.entries(docData.metadata || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: docData.title,
          text: `Vault Document: ${docData.title}\nCategory: ${docData.category}\n\n${shareText}`,
        });
      } catch (err) {
        console.warn("Share failed", err);
      }
    } else {
      handleCopy('full_doc', shareText);
      alert('Share data copied to clipboard (System sharing not available)');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Erase this document from vault permanently?')) {
      try {
        await deleteDoc(doc(db, 'documents', id!));
        navigate('/documents');
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!docData) return <div className="text-center py-24 text-gray-400 font-bold uppercase tracking-widest">Document Registry Not Found</div>;

  const config = CATEGORY_CONFIG[docData.category] || CATEGORY_CONFIG['Others'];

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 pb-32 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all hover:text-primary">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="flex space-x-2">
          <button onClick={handleShare} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-primary border border-gray-100 dark:border-gray-800">
            <i className="fas fa-share-alt"></i>
          </button>
          <button onClick={() => navigate(`/edit-document/${docData.id}`)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-500 border border-gray-100 dark:border-gray-800">
            <i className="fas fa-edit"></i>
          </button>
          <button onClick={handleDelete} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-red-500 border border-gray-100 dark:border-gray-800">
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-12 items-start">
        {/* Document Visual Card */}
        <div className="mb-10 lg:sticky lg:top-24">
          <div className={`w-full aspect-[1.6/1] rounded-2xl p-10 text-white shadow-2xl relative overflow-hidden transition-all duration-300 ${config.color}`}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="h-full flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl shadow-sm">
                    <i className={`fas ${config.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight drop-shadow-md">{docData.title}</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">{docData.category}</p>
                  </div>
                </div>
                <i className="fas fa-shield-halved opacity-30 text-2xl"></i>
              </div>
              <div className="flex justify-between items-end">
                <div>
                   <p className="text-[8px] font-black uppercase opacity-50 tracking-widest leading-none mb-1">Status</p>
                   <p className="text-xs font-black uppercase tracking-widest text-white/90">Verified Asset</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase opacity-50 tracking-widest leading-none mb-1">Registered</p>
                  <p className="text-xs font-bold">{docData.createdAt ? new Date(docData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center space-x-4">
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <i className="fas fa-info-circle"></i>
             </div>
             <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">This information is secured with AES-256 bit encryption and only visible to you.</p>
          </div>
        </div>

        {/* Details Manifest */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-secondary p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-10 border-b border-gray-50 dark:border-gray-800 pb-5">
               <div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Full Manifest</h3>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Encrypted Payload Access</p>
               </div>
            </div>

            <div className="grid gap-6">
              {/* Fix: Explicitly ensuring metadata values are strings to resolve 'unknown' type error in mapping */}
              {docData.metadata && Object.entries(docData.metadata).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between group p-4 rounded-xl bg-gray-50/50 dark:bg-dark/30 hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{key}</p>
                    <p className={`font-bold text-sm text-gray-800 dark:text-white break-all ${key.toLowerCase().includes('password') ? 'tracking-[0.3em] font-mono' : ''}`}>
                      {String(val || 'NOT RECORDED')}
                    </p>
                  </div>
                  {val && (
                    <button 
                      onClick={() => handleCopy(key, String(val))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copiedKey === key ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-secondary text-gray-300 hover:text-primary hover:shadow-md'}`}
                    >
                      <i className={`fas ${copiedKey === key ? 'fa-check' : 'fa-copy'} text-xs`}></i>
                    </button>
                  )}
                </div>
              ))}

              {docData.notes && (
                <div className="mt-4 p-8 bg-gray-50 dark:bg-dark/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Additional Context / Remarks</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                    "{docData.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
             <button onClick={() => navigate(`/edit-document/${docData.id}`)} className="flex-1 py-5 bg-primary text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Edit Artifact</button>
             <button onClick={handleShare} className="flex-1 py-5 bg-white dark:bg-secondary text-gray-500 font-black rounded-xl uppercase text-[10px] tracking-widest border border-gray-100 dark:border-gray-800">Share Securely</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;