
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const { useNavigate } = Router as any;

const About: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-400 shadow-sm transition-all active:scale-90">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">About Platform</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Identity</p>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-secondary p-10 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-2xl shadow-primary/30">
              <i className="fas fa-wallet"></i>
            </div>
            <h2 className="text-2xl font-black mb-1">Deshi Wallet & Vault</h2>
            <div className="bg-primary/5 px-4 py-1.5 rounded-full inline-block">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">Version {config?.currentAppVersion || '1.3.0 Stable'}</span>
            </div>
          </div>
          
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: config?.content?.about || "Loading application info..." }}
          />
        </div>
        
        <div className="text-center">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">SECURE INFRASTRUCTURE BY DESHI TECH</p>
        </div>
      </div>
    </div>
  );
};

export default About;
