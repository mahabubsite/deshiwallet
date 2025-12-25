
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const { useNavigate } = Router as any;

const HelpSupport: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, []);
  
  return (
    <div className="max-w-[900px] mx-auto p-4 md:py-16 pb-24">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all active:scale-90">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Support Engine</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Intelligence & Help</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 animate-in fade-in duration-500">
        <div className="space-y-8">
          <div className="bg-primary p-10 text-white border-b-8 border-black/10">
            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Direct Assist</h3>
            <p className="text-xs opacity-70 font-bold uppercase leading-relaxed mb-8 tracking-widest">
              {config?.content?.helpHeader || "Our encrypted support channel is available 24/7 for verified identity holders."}
            </p>
            <button className="w-full bg-white text-primary py-4 font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all">
              Initialize Live Link
            </button>
          </div>

          <div className="bg-white dark:bg-secondary p-8 border border-gray-100 dark:border-gray-800">
             <p className="text-[10px] text-gray-400 font-black uppercase mb-4 tracking-widest">System Status</p>
             <div className="flex items-center space-x-3">
               <div className="w-3 h-3 bg-emerald-500 border border-white dark:border-dark"></div>
               <span className="text-xs font-black text-emerald-500 uppercase">All Nodes Operational</span>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary p-8 md:p-12 border border-gray-100 dark:border-gray-800">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-10 pb-4 border-b border-gray-50 dark:border-gray-800">Knowledge Repository</h3>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: config?.content?.faq || "<p>Loading documentation database...</p>" }}
          />
          
          <div className="mt-12 pt-10 border-t border-gray-50 dark:border-gray-800 text-center">
            <button onClick={() => navigate('/settings/report')} className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline decoration-2 underline-offset-4">Log a Technical Report</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
