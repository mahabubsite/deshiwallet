
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDeletionRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'deletionRequests'), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (requestId: string, approve: boolean) => {
    const adminFeedback = feedback[requestId] || 'Request processed by admin.';
    try {
      if (approve) {
        if (window.confirm('PERMANENTLY DELETE ALL USER DATA? This cannot be undone.')) {
           // In a real app, trigger a Cloud Function to purge everything
           await deleteDoc(doc(db, 'deletionRequests', requestId));
           alert('Account data purge initiated.');
        }
      } else {
        await updateDoc(doc(db, 'deletionRequests', requestId), { status: 'declined', adminFeedback });
        alert('Request declined with feedback.');
      }
    } catch (err) {
      alert('Operation failed.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <h1 className="text-2xl font-black mb-1">Exit Requests</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Process account closure queue: <span className="text-red-500">{requests.length}</span></p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-50 dark:bg-dark/50 p-20 rounded-[40px] text-center border border-dashed border-gray-200 dark:border-gray-800">
            <i className="fas fa-trash-restore text-5xl text-gray-200 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No pending removal requests</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map(req => (
              <div key={req.id} className="p-8 bg-red-50/30 dark:bg-red-900/10 rounded-[40px] border border-red-100 dark:border-red-900/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-white dark:bg-secondary rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                        <i className="fas fa-user-minus"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-red-600">{req.userEmail}</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Submitted: {new Date(req.createdAt?.seconds * 1000).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-secondary p-5 rounded-3xl border border-red-50 dark:border-red-900/20">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Stated Reason</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 italic leading-relaxed">"{req.reason || 'No reason specified'}"</p>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-80 space-y-4">
                    <textarea 
                      placeholder="Admin response/feedback..."
                      className="w-full p-4 bg-white dark:bg-secondary border-none rounded-2xl outline-none text-xs font-bold min-h-[100px]"
                      value={feedback[req.id] || ''}
                      onChange={(e) => setFeedback({ ...feedback, [req.id]: e.target.value })}
                    ></textarea>
                    <div className="flex space-x-3">
                       <button onClick={() => handleAction(req.id, false)} className="flex-1 py-3 bg-gray-200 dark:bg-dark rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500">Decline</button>
                       <button onClick={() => handleAction(req.id, true)} className="flex-[1.5] py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/30">Approve & Purge</button>
                    </div>
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

export default AdminDeletionRequests;
