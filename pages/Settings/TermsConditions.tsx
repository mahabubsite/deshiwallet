
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const { useNavigate } = Router as any;

const TermsConditions: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setContent(snap.data().content?.terms || '');
    });
    return unsub;
  }, []);

  return (
    <div className="max-w-[800px] mx-auto p-4 md:py-16">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tight">Terms of Use</h1>
      </div>

      <div className="bg-white dark:bg-secondary p-8 md:p-12 border border-gray-100 dark:border-gray-800">
        <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap font-medium">
          {content || "Loading terms of service database..."}
        </div>
      </div>
      
      <div className="mt-12 text-center">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">LEGAL SUBJECT DOCUMENTATION</p>
      </div>
    </div>
  );
};

export default TermsConditions;
