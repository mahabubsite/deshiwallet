
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const { useNavigate } = Router as any;

const PrivacyCenter: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, []);

  return (
    <div className="max-w-[800px] mx-auto p-4 md:py-16 pb-24">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all active:scale-90">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Privacy Protocol</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance & Ethics</p>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary p-8 md:p-12 border border-gray-100 dark:border-gray-800 animate-in fade-in duration-500">
        <div className="border-l-4 border-primary pl-8 mb-10">
          <h2 className="text-sm font-black uppercase text-primary tracking-widest mb-2">Zero-Knowledge Architecture</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Your data is secured locally before transmission.</p>
        </div>

        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: config?.content?.privacy || "<p>Loading privacy architecture...</p>" }}
        />

        <div className="pt-12 mt-12 border-t-2 border-gray-50 dark:border-gray-800">
          <button className="w-full py-5 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary transition-all">
            <i className="fas fa-file-export mr-3"></i> Export Subject Access Request (SAR)
          </button>
        </div>
      </div>

      <div className="mt-12 text-center">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">SYSTEM COMPLIANCE: 2024.v1</p>
      </div>
    </div>
  );
};

export default PrivacyCenter;
