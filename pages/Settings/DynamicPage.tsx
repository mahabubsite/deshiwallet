
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const { useNavigate, useParams } = Router as any;

const DynamicPage: React.FC = () => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) {
        const config = snap.data();
        const found = (config.customPages || []).find((p: any) => p.id === pageId);
        setPage(found);
      }
      setLoading(false);
    });
    return unsub;
  }, [pageId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin"></div></div>;

  if (!page) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-black uppercase">Resource Unavailable</h2>
      <button onClick={() => navigate('/settings')} className="mt-8 text-[10px] font-black uppercase text-primary tracking-widest border-b-2 border-primary">Return to Settings</button>
    </div>
  );

  return (
    <div className="max-w-[900px] mx-auto p-4 md:py-16 pb-24">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all active:scale-90">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{page.title}</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Document</p>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary p-8 md:p-16 border border-gray-100 dark:border-gray-800 animate-in fade-in duration-500">
        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: page.content || "<p>System resource contains no data.</p>" }}
        />
      </div>

      <div className="mt-16 text-center">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">SECURED BY DESHI VAULT INFRASTRUCTURE</p>
      </div>
    </div>
  );
};

export default DynamicPage;
