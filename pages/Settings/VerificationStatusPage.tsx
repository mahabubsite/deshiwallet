
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../App';

const { useNavigate } = Router as any;

const VerificationStatusPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // We remove orderBy and limit from the query to avoid the need for a composite index
    // which causes the 'failed-precondition' error. We will sort locally instead.
    const q = query(
      collection(db, 'verificationRequests'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort locally by createdAt descending to find the most recent request
        docs.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setLatestRequest(docs[0]);
      } else {
        setLatestRequest(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Verification Status Listener Error:", error);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: 'fa-check-circle',
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 dark:bg-emerald-900/10',
          border: 'border-emerald-100 dark:border-emerald-900/30',
          label: 'Verified Identity'
        };
      case 'rejected':
        return {
          icon: 'fa-times-circle',
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/10',
          border: 'border-red-100 dark:border-red-900/30',
          label: 'Rejected / Invalid'
        };
      default:
        return {
          icon: 'fa-clock',
          color: 'text-amber-500',
          bg: 'bg-amber-50 dark:bg-amber-900/10',
          border: 'border-amber-100 dark:border-amber-900/30',
          label: 'Under Manual Review'
        };
    }
  };

  const status = profile?.status || 'pending';
  const config = getStatusConfig(status);

  return (
    <div className="max-w-[800px] mx-auto p-4 md:py-16 pb-24">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate('/settings')} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all active:scale-90">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Verification Center</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity Compliance Status</p>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Status Card */}
        <div className={`p-10 border-2 rounded-[48px] text-center ${config.bg} ${config.border}`}>
          <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-6 bg-white dark:bg-secondary shadow-xl shadow-black/5 ${config.color}`}>
            <i className={`fas ${config.icon}`}></i>
          </div>
          <h2 className={`text-2xl font-black uppercase mb-2 ${config.color}`}>{config.label}</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Status of Record: {status}</p>
        </div>

        {/* Data Display */}
        <div className="bg-white dark:bg-secondary p-8 md:p-12 border border-gray-100 dark:border-gray-800 rounded-[48px] shadow-sm">
          <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-10 pb-4 border-b border-gray-50 dark:border-gray-800 flex items-center">
            <i className="fas fa-database mr-3"></i> Encrypted Registry Data
          </h3>
          
          {loading ? (
            <div className="py-10 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : latestRequest ? (
            <div className="grid gap-8">
              <div className="border-l-4 border-primary/20 pl-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Identification Document</span>
                <p className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">{latestRequest.docType}</p>
              </div>
              <div className="border-l-4 border-primary/20 pl-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Credential Value</span>
                <p className="text-lg font-black text-gray-800 dark:text-white tracking-widest">
                  {latestRequest.docContent?.slice(0, 4)} •••• ••••
                </p>
              </div>
              <div className="border-l-4 border-primary/20 pl-6">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Submission Date</span>
                <p className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">
                  {latestRequest.createdAt ? new Date(latestRequest.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No prior verification records found in the vault.</p>
            </div>
          )}
        </div>

        {/* Re-verification / Action Button */}
        <div className="p-8 bg-gray-50 dark:bg-dark/50 border border-gray-100 dark:border-gray-800 rounded-[40px] text-center">
          <h4 className="text-[11px] font-black uppercase tracking-widest mb-4">Update Identity Records?</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8 max-w-sm mx-auto">
            If your identification has changed or you wish to re-verify using a different document, you can initiate a new session.
          </p>
          <button 
            onClick={() => navigate('/verify')}
            className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-3xl hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            Submit New Verification
          </button>
        </div>
      </div>

      <div className="mt-12 text-center">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">SYSTEM COMPLIANCE: ISO-27001 EQUIVALENT</p>
      </div>
    </div>
  );
};

export default VerificationStatusPage;
