
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { VerificationStatus } from '../../types';

const AdminVerification: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'verificationRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAction = async (requestId: string, userId: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'verificationRequests', requestId), { status });
      await updateDoc(doc(db, 'users', userId), { 
        status: status === 'verified' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED 
      });

      // SEND AUTOMATED NOTIFICATION
      await addDoc(collection(db, 'notifications'), {
        userId,
        title: status === 'verified' ? 'Identity Verified! ✅' : 'Identity Rejected ❌',
        message: status === 'verified' 
          ? 'Great news! Your identity has been verified. You now have full access to premium wallet features.' 
          : 'Your identity verification was rejected. Please review your document details and try again.',
        read: false,
        createdAt: serverTimestamp()
      });

      alert(`User ${status} successfully and notified.`);
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="mb-8">
          <h1 className="text-2xl font-black">Identity Verification</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Pending manual review queue</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-50 dark:bg-dark/50 p-20 rounded-[32px] text-center border border-dashed border-gray-200 dark:border-gray-800">
            <i className="fas fa-check-circle text-5xl text-gray-200 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No pending requests</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map(req => (
              <div key={req.id} className="bg-gray-50 dark:bg-dark/50 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 transition-all hover:border-primary/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-white dark:bg-secondary rounded-[24px] flex items-center justify-center text-primary shadow-sm">
                      <i className={`fas ${req.docType === 'Passport' ? 'fa-passport' : 'fa-id-card'} text-2xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{req.userName || 'Anonymous User'}</h3>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 inline-block px-2 py-0.5 rounded-md mt-1">
                        {req.docType}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-white dark:bg-secondary p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Submitted Content</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap italic">
                      {req.docContent || 'No details provided'}
                    </p>
                  </div>

                  <div className="flex space-x-3 lg:flex-col lg:space-x-0 lg:space-y-3">
                    <button 
                       onClick={() => handleAction(req.id, req.userId, 'verified')}
                       className="flex-1 lg:w-32 py-3 bg-primary text-white text-xs font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, req.userId, 'rejected')}
                      className="flex-1 lg:w-32 py-3 bg-red-50 dark:bg-red-900/10 text-red-500 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;
