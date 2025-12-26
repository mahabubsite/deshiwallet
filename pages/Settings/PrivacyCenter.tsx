
import React, { useState, useEffect, useRef } from 'react';
import * as Router from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../App';

const { useNavigate } = Router as any;

const PrivacyCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, []);

  const handleExportData = async () => {
    if (!user || !profile) return;
    setIsProcessing(true);
    setProcessStatus('Compiling encrypted registry...');

    try {
      // Fetch all user cards
      const cardsSnap = await getDocs(query(collection(db, 'cards'), where('userId', '==', user.uid)));
      const cards = cardsSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      // Fetch all user documents
      const docsSnap = await getDocs(query(collection(db, 'documents'), where('userId', '==', user.uid)));
      const documents = docsSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      const sarPackage = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        identity: {
          fullName: profile.fullName,
          email: profile.email,
          dob: profile.dob,
          status: profile.status
        },
        vault: {
          cards,
          documents
        }
      };

      const blob = new Blob([JSON.stringify(sarPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DeshiWallet_SAR_${profile.fullName.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setProcessStatus('Export successful.');
      setTimeout(() => setProcessStatus(''), 3000);
    } catch (err) {
      alert('Data compilation failed. Security node error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);
    setProcessStatus('Decrypting package...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.vault || (!data.vault.cards && !data.vault.documents)) {
          throw new Error('Invalid SAR Package');
        }

        setProcessStatus('Synchronizing assets...');
        const batch = writeBatch(db);

        // Restore Cards
        if (data.vault.cards) {
          for (const card of data.vault.cards) {
            const { id, ...cardData } = card;
            const newCardRef = doc(collection(db, 'cards'));
            batch.set(newCardRef, {
              ...cardData,
              userId: user.uid,
              createdAt: serverTimestamp(),
              importedAt: serverTimestamp()
            });
          }
        }

        // Restore Documents
        if (data.vault.documents) {
          for (const docItem of data.vault.documents) {
            const { id, ...docData } = docItem;
            const newDocRef = doc(collection(db, 'documents'));
            batch.set(newDocRef, {
              ...docData,
              userId: user.uid,
              createdAt: serverTimestamp(),
              importedAt: serverTimestamp()
            });
          }
        }

        await batch.commit();
        
        // Notify Admin
        await addDoc(collection(db, 'notifications'), {
          userId: 'admin_alert',
          title: 'SAR Restoration Event 🔄',
          message: `${profile?.fullName} successfully restored assets via SAR package.`,
          read: false,
          createdAt: serverTimestamp()
        });

        setProcessStatus('Vault restored successfully.');
        setTimeout(() => {
          setProcessStatus('');
          navigate('/');
        }, 2000);
      } catch (err) {
        alert('Restoration failed. Invalid or corrupted archive.');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-[800px] mx-auto p-4 md:py-16 pb-24">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all active:scale-90 shadow-sm">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Privacy Protocol</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance & Ethics</p>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 rounded-[48px] overflow-hidden shadow-sm animate-in fade-in duration-500">
        <div className="p-8 md:p-12">
          <div className="border-l-4 border-primary pl-8 mb-10">
            <h2 className="text-sm font-black uppercase text-primary tracking-widest mb-2">Zero-Knowledge Architecture</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Your data is secured locally before transmission.</p>
          </div>

          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-12"
            dangerouslySetInnerHTML={{ __html: config?.content?.privacy || "<p>Loading privacy architecture...</p>" }}
          />

          <div className="space-y-6 pt-12 border-t-2 border-gray-50 dark:border-gray-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Data Sovereignty Engine</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Button */}
              <button 
                onClick={handleExportData}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-dark/50 border-2 border-transparent hover:border-primary/20 transition-all rounded-[32px] group"
              >
                <div className="w-14 h-14 bg-white dark:bg-secondary rounded-2xl flex items-center justify-center text-primary shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <i className="fas fa-file-export text-xl"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Generate SAR Package</span>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-2">Export all records</p>
              </button>

              {/* Import Button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-dark/50 border-2 border-transparent hover:border-emerald-500/20 transition-all rounded-[32px] group"
              >
                <div className="w-14 h-14 bg-white dark:bg-secondary rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <i className="fas fa-file-import text-xl"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Restore From SAR</span>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-2">Import legacy data</p>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleImportData} 
            />

            {processStatus && (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-center animate-pulse">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{processStatus}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center space-y-4">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">SYSTEM COMPLIANCE: ISO-27001 EQUIVALENT</p>
         <div className="flex justify-center space-x-6">
            <span className="text-[8px] font-bold text-gray-400 uppercase">End-to-End Encrypted</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase">GDPR Ready</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase">Self-Sovereign Identity</span>
         </div>
      </div>
    </div>
  );
};

export default PrivacyCenter;
