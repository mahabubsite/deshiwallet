
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminReports: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbackList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleToggleRead = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { 
        status: currentStatus === 'read' ? 'unread' : 'read' 
      });
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (window.confirm('Delete this user submission?')) {
      try {
        await deleteDoc(doc(db, 'feedback', id));
      } catch (e) {
        alert('Failed to delete feedback');
      }
    }
  };

  const filteredItems = feedbackList.filter(item => {
    const matchesType = filterType === 'All' || item.type === filterType;
    const matchesStatus = filterStatus === 'All' || 
                         (filterStatus === 'Unread' ? item.status === 'unread' : item.status === 'read');
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-2xl font-black">User Sentiment</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Inbox management for bug reports & feedback</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-gray-50 dark:bg-dark p-1.5 rounded-2xl">
               {['All', 'Unread', 'Read'].map(s => (
                 <button
                   key={s}
                   onClick={() => setFilterStatus(s)}
                   className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white dark:bg-secondary text-primary shadow-sm' : 'text-gray-400'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
             
             <select 
               value={filterType} 
               onChange={e => setFilterType(e.target.value)}
               className="bg-gray-50 dark:bg-dark px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none outline-none focus:ring-2 focus:ring-primary cursor-pointer"
             >
               <option value="All">All Categories</option>
               <option value="Feedback">Feedback</option>
               <option value="Bug Report">Bug Reports</option>
               <option value="General Query">Queries</option>
             </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-dark/20 rounded-[48px] border-2 border-dashed border-gray-100 dark:border-gray-800">
            <i className="fas fa-inbox text-5xl text-gray-100 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No matching submissions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredItems.map(item => (
              <div key={item.id} className={`p-8 rounded-[48px] border transition-all ${item.status === 'unread' ? 'bg-primary/5 border-primary/20 shadow-xl shadow-primary/5' : 'bg-white dark:bg-dark/40 border-gray-100 dark:border-gray-800'}`}>
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                      item.type === 'Bug Report' ? 'bg-red-500 text-white' : 
                      item.type === 'Feedback' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
                    }`}>
                      <i className={`fas ${
                        item.type === 'Bug Report' ? 'fa-bug' : 
                        item.type === 'Feedback' ? 'fa-heart' : 'fa-question-circle'
                      }`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight">{item.userName}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleToggleRead(item.id, item.status)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.status === 'read' ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white shadow-lg'}`}
                      title={item.status === 'read' ? 'Mark Unread' : 'Mark Read'}
                    >
                      <i className={`fas ${item.status === 'read' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteFeedback(item.id)}
                      className="w-12 h-12 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50/50 dark:bg-dark/60 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800/50 min-h-[140px] relative">
                  <div className="absolute top-4 right-6 text-[8px] font-black uppercase text-gray-300 tracking-[0.3em]">Encrypted Storage</div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-relaxed italic">
                    "{item.text}"
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-calendar-alt text-gray-300 text-[10px]"></i>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
                  </div>
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.status === 'unread' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
