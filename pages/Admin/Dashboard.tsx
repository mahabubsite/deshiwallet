
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    verified: 0,
    cards: 0,
    documents: 0,
    pendingVerifications: 0,
    deletionRequests: 0,
    feedbackCount: 0,
    activeToday: 42 
  });
  const [latestUsers, setLatestUsers] = useState<any[]>([]);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ 
        ...prev, 
        users: snap.size, 
        verified: snap.docs.filter(d => d.data().status === 'verified').size 
      }));
    });

    const qLatest = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10));
    const unsubLatest = onSnapshot(qLatest, (snap) => {
       setLatestUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCards = onSnapshot(collection(db, 'cards'), (snap) => {
      setStats(prev => ({ ...prev, cards: snap.size }));
    });

    const unsubDocs = onSnapshot(collection(db, 'documents'), (snap) => {
      setStats(prev => ({ ...prev, documents: snap.size }));
    });

    const unsubVerif = onSnapshot(query(collection(db, 'verificationRequests'), where('status', '==', 'pending')), (snap) => {
      setStats(prev => ({ ...prev, pendingVerifications: snap.size }));
    });

    const unsubDeletion = onSnapshot(collection(db, 'deletionRequests'), (snap) => {
      setStats(prev => ({ ...prev, deletionRequests: snap.size }));
    });
    
    const unsubFeedback = onSnapshot(collection(db, 'feedback'), (snap) => {
      setStats(prev => ({ ...prev, feedbackCount: snap.size }));
    });

    return () => {
      unsubUsers(); unsubLatest(); unsubCards(); unsubDocs(); unsubVerif(); unsubDeletion(); unsubFeedback();
    };
  }, []);

  const fetchFullData = async () => {
    const [u, c, d, v, f] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'cards')),
      getDocs(collection(db, 'documents')),
      getDocs(collection(db, 'verificationRequests')),
      getDocs(collection(db, 'feedback'))
    ]);
    return {
      users: u.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      cards: c.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      docs: d.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      verif: v.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      feedback: f.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      const data = await fetchFullData();
      let csv = "FULL SYSTEM AUDIT - " + new Date().toLocaleString() + "\n\n";
      
      csv += "--- USERS ---\nName,Email,Status,Role,Joined\n";
      data.users.forEach((u: any) => {
        csv += `${u.fullName},${u.email},${u.status},${u.role},${u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}\n`;
      });

      csv += "\n--- CARDS ---\nBank,Holder,Card (Last 4),Method,Created\n";
      data.cards.forEach((c: any) => {
        csv += `${c.bankName},${c.holderName},${c.cardNumber?.slice(-4)},${c.paymentMethod},${c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}\n`;
      });

      csv += "\n--- DOCUMENTS ---\nTitle,Category,Created\n";
      data.docs.forEach((docItem: any) => {
        csv += `${docItem.title},${docItem.category},${docItem.createdAt?.seconds ? new Date(docItem.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Full_System_Audit_${Date.now()}.csv`;
      a.click();
    } catch (err) {
      alert('CSV Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const data = await fetchFullData();
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>Full System Audit Report</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #1e293b; }
              h1 { color: #3b82f6; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 30px; }
              h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 40px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; color: #94a3b8; font-size: 10px; }
              td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
              .footer { margin-top: 50px; font-size: 10px; color: #cbd5e1; text-align: center; }
            </style>
          </head>
          <body>
            <h1>DeshiWallet System Audit</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            
            <h2>Platform Summary</h2>
            <table>
              <tr><th>Metric</th><th>Count</th></tr>
              <tr><td>Total Users</td><td>${stats.users}</td></tr>
              <tr><td>Verified Users</td><td>${stats.verified}</td></tr>
              <tr><td>Total Cards</td><td>${stats.cards}</td></tr>
              <tr><td>Total Documents</td><td>${stats.documents}</td></tr>
            </table>

            <h2>User Registry</h2>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                ${data.users.map((u: any) => `<tr><td>${u.fullName}</td><td>${u.email}</td><td>${u.status}</td><td>${u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td></tr>`).join('')}
              </tbody>
            </table>

            <h2>Asset Index (Cards)</h2>
            <table>
              <thead><tr><th>Bank</th><th>Holder</th><th>Method</th><th>Created</th></tr></thead>
              <tbody>
                ${data.cards.map((c: any) => `<tr><td>${c.bankName}</td><td>${c.holderName}</td><td>${c.paymentMethod}</td><td>${c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td></tr>`).join('')}
              </tbody>
            </table>

            <div class="footer">Confidential System Document • DeshiWallet Security Node</div>
          </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      alert('PDF Export failed');
    } finally {
      setExporting(null);
    }
  };

  const topStats = [
    { label: 'Total Users', value: stats.users, icon: 'fa-users', color: 'bg-blue-50 text-blue-500', trend: '+12%' },
    { label: 'Total Cards', value: stats.cards, icon: 'fa-credit-card', color: 'bg-indigo-50 text-indigo-500', trend: '+5%' },
    { label: 'Total Docs', value: stats.documents, icon: 'fa-file-shield', color: 'bg-emerald-50 text-emerald-500', trend: '+18%' },
    { label: 'Pending Tasks', value: stats.pendingVerifications, icon: 'fa-bolt', color: 'bg-amber-50 text-amber-500', trend: 'High' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">System Insights</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Real-time Platform Orchestration</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportCSV}
            disabled={!!exporting}
            className="flex items-center space-x-3 px-6 py-4 bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <i className={`fas ${exporting === 'csv' ? 'fa-spinner fa-spin' : 'fa-file-csv'} text-primary`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Download CSV</span>
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={!!exporting}
            className="flex items-center space-x-3 px-6 py-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
            <i className={`fas ${exporting === 'pdf' ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Download PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-secondary p-6 rounded-[32px] shadow-sm border border-white dark:border-gray-800 group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-xl shadow-sm`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">{stat.trend}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800 dark:text-white leading-none mb-1">{stat.value.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold">Activity Pulse</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Load & Engagement</p>
              </div>
              <div className="flex space-x-2">
                 <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black text-primary uppercase">Live</span>
              </div>
            </div>
            
            <div className="h-48 w-full relative group">
              <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0 80 Q 50 20, 100 60 T 200 40 T 300 10 T 400 50 L 400 100 L 0 100 Z" 
                  fill="url(#chartGradient)" 
                />
                <path 
                  d="M0 80 Q 50 20, 100 60 T 200 40 T 300 10 T 400 50" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
                <circle cx="100" cy="60" r="4" fill="#3B82F6" />
                <circle cx="200" cy="40" r="4" fill="#3B82F6" />
                <circle cx="300" cy="10" r="4" fill="#3B82F6" />
              </svg>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-50 dark:border-gray-800">
               {[
                 { v: stats.verified, l: 'Verified' },
                 { v: stats.deletionRequests, l: 'Deletions' },
                 { v: stats.feedbackCount, l: 'Feedback' },
                 { v: stats.activeToday, l: 'Engagement' }
               ].map((item, i) => (
                 <div key={i} className="text-center">
                    <p className="text-lg font-black text-gray-800 dark:text-white leading-none">{item.v}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{item.l}</p>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold">Latest Signups Audit</h3>
              <button className="text-[10px] font-black text-primary px-4 py-2 bg-primary/5 rounded-xl uppercase tracking-widest">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                    <th className="pb-4 px-2">Member</th>
                    <th className="pb-4 px-2">Compliance</th>
                    <th className="pb-4 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {latestUsers.map((u, i) => (
                    <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-dark/20 transition-all">
                      <td className="py-4 px-2 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark flex items-center justify-center text-xs font-black text-gray-400">
                          {u.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none mb-1">{u.fullName || 'Anonymous'}</p>
                          <p className="text-[9px] text-gray-400 font-bold">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase ${u.status === 'verified' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-[10px] font-bold text-gray-400">
                        {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <i className="fas fa-file-export"></i>
               </div>
               <h3 className="text-xl font-black mb-1">Audit Center</h3>
               <p className="text-xs opacity-70 mb-8 font-medium">Export all system activity logs</p>
               <div className="space-y-3">
                 <button 
                  onClick={handleExportCSV}
                  disabled={!!exporting}
                  className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                 >
                   {exporting === 'csv' ? 'Processing...' : 'CSV Audit'}
                 </button>
                 <button 
                  onClick={handleExportPDF}
                  disabled={!!exporting}
                  className="w-full py-4 bg-indigo-500/50 text-white border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                 >
                   {exporting === 'pdf' ? 'Generating...' : 'PDF Report'}
                 </button>
               </div>
             </div>
             <i className="fas fa-fingerprint absolute -bottom-10 -right-10 text-[180px] opacity-10 rotate-12"></i>
          </div>

          <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
            <h3 className="text-lg font-bold mb-8">Task Distribution</h3>
            <div className="space-y-6">
              {[
                { label: 'Verify Queue', val: stats.pendingVerifications, color: 'bg-primary', total: 50 },
                { label: 'Unread Feedback', val: stats.feedbackCount, color: 'bg-amber-500', total: 50 },
                { label: 'Exits Pending', val: stats.deletionRequests, color: 'bg-red-500', total: 20 },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-800 dark:text-white">{item.val}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-dark h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${item.color} h-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${Math.min((item.val / item.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
