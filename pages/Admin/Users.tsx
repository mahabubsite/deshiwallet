
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, VerificationStatus, BankCard, VaultDocument, UserRole } from '../../types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userAssets, setUserAssets] = useState<{ cards: BankCard[], docs: VaultDocument[] }>({ cards: [], docs: [] });
  const [updatingRole, setUpdatingRole] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ ...d.data() } as UserProfile)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const viewUserProfile = async (user: UserProfile) => {
    setSelectedUser(user);
    const cardsQuery = query(collection(db, 'cards'), where('userId', '==', user.uid));
    const docsQuery = query(collection(db, 'documents'), where('userId', '==', user.uid));
    
    const [cardSnap, docSnap] = await Promise.all([getDocs(cardsQuery), getDocs(docsQuery)]);
    setUserAssets({
      cards: cardSnap.docs.map(d => ({ id: d.id, ...d.data() } as BankCard)),
      docs: docSnap.docs.map(d => ({ id: d.id, ...d.data() } as VaultDocument))
    });
  };

  const handleExportAllUsersCSV = () => {
    let csv = "User Name,Email,Role,Status,Joined\n";
    users.forEach(u => {
      csv += `${u.fullName},${u.email},${u.role},${u.status},${u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `All_Users_Directory_${Date.now()}.csv`;
    a.click();
  };

  const handleExportAllUsersPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>User Directory Audit</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #3b82f6; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            .meta { font-size: 10px; color: #64748b; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f8fafc; text-align: left; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; color: #94a3b8; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }
            .status-verified { color: #10b981; font-weight: bold; }
            .status-pending { color: #f59e0b; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 10px; color: #cbd5e1; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>User Directory Audit</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()} • Total Members: ${users.length}</div>
          
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Authority</th>
                <th>Compliance</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${u.fullName || 'Anonymous'}</strong></td>
                  <td>${u.email}</td>
                  <td style="text-transform: capitalize;">${u.role}</td>
                  <td class="status-${u.status}">${u.status.toUpperCase()}</td>
                  <td>${u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">Confidential System Document • DeshiWallet Identity Registry</div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadUserReport = (type: 'csv' | 'pdf') => {
    if (!selectedUser) return;
    
    if (type === 'csv') {
      let csv = `REPORT FOR: ${selectedUser.fullName}\nEmail: ${selectedUser.email}\nStatus: ${selectedUser.status}\nRole: ${selectedUser.role}\n\n`;
      csv += "--- CARDS ---\nBank,Method,Last 4\n";
      userAssets.cards.forEach(c => csv += `${c.bankName},${c.paymentMethod},${c.cardNumber.slice(-4)}\n`);
      csv += "\n--- DOCUMENTS ---\nTitle,Category\n";
      userAssets.docs.forEach(d => csv += `${d.title},${d.category}\n`);

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${selectedUser.fullName.replace(/\s+/g, '_')}.csv`;
      a.click();
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      const html = `
        <html>
          <head>
            <title>User Report - ${selectedUser.fullName}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { margin: 0; color: #1e293b; }
              .meta { color: #64748b; font-size: 14px; margin-top: 5px; }
              h2 { font-size: 14px; text-transform: uppercase; color: #3b82f6; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              th { text-align: left; padding: 8px; background: #f8fafc; color: #64748b; }
              td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${selectedUser.fullName}</h1>
              <div class="meta">${selectedUser.email} • Status: ${selectedUser.status} • Role: ${selectedUser.role}</div>
            </div>
            
            <h2>Encrypted Assets (Cards)</h2>
            <table>
              <tr><th>Bank</th><th>Method</th><th>Last 4</th></tr>
              ${userAssets.cards.map(c => `<tr><td>${c.bankName}</td><td>${c.paymentMethod}</td><td>${c.cardNumber.slice(-4)}</td></tr>`).join('')}
            </table>

            <h2>Vault Inventory (Documents)</h2>
            <table>
              <tr><th>Title</th><th>Category</th></tr>
              ${userAssets.docs.map(d => `<tr><td>${d.title}</td><td>${d.category}</td></tr>`).join('')}
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleUpdateRole = async (newRole: UserRole) => {
    if (!selectedUser) return;
    if (window.confirm(`Update ${selectedUser.fullName}'s role to ${newRole.toUpperCase()}?`)) {
      setUpdatingRole(true);
      try {
        await updateDoc(doc(db, 'users', selectedUser.uid), { role: newRole });
        setSelectedUser({ ...selectedUser, role: newRole });
        alert('Role updated successfully.');
      } catch (err) {
        alert('Failed to update role.');
      } finally {
        setUpdatingRole(false);
      }
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        setSelectedUser(null);
      } catch (err) {
        alert('Error deleting user');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    const matchesStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white dark:bg-secondary p-5 md:p-10 rounded-[48px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-12 gap-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Member Governance</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Directory size: {users.length} Records</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-50 dark:bg-dark p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <button 
                onClick={handleExportAllUsersCSV}
                className="px-4 py-2.5 bg-white dark:bg-secondary text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-primary transition-all shadow-sm"
              >
                <i className="fas fa-file-csv mr-2"></i> CSV
              </button>
              <button 
                onClick={handleExportAllUsersPDF}
                className="px-4 py-2.5 bg-white dark:bg-secondary text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-primary transition-all shadow-sm ml-1"
              >
                <i className="fas fa-file-pdf mr-2"></i> PDF
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input
                type="text"
                placeholder="Search identity..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 text-sm font-bold transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)}
              className="bg-gray-50 dark:bg-dark px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all"
            >
              <option value="All">All Roles</option>
              <option value="admin">Admins</option>
              <option value="moderator">Moderators</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-5">Identity</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Authority</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="group hover:bg-gray-50/50 dark:hover:bg-dark/20 transition-all cursor-pointer" onClick={() => viewUserProfile(user)}>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${user.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                          {user.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-white">{user.fullName || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                        user.status === VerificationStatus.VERIFIED ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 
                        user.status === VerificationStatus.PENDING ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`text-[10px] font-black uppercase flex items-center ${user.role === 'admin' ? 'text-amber-500' : user.role === 'moderator' ? 'text-indigo-400' : 'text-gray-400'}`}>
                         <i className={`fas ${user.role === 'admin' ? 'fa-crown' : user.role === 'moderator' ? 'fa-shield' : 'fa-user'} mr-2`}></i>
                         {user.role}
                       </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="w-10 h-10 bg-gray-50 dark:bg-dark rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all ml-auto shadow-sm">
                        <i className="fas fa-chevron-right text-[10px]"></i>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-secondary w-full max-w-6xl rounded-[60px] p-8 md:p-16 shadow-2xl animate-in zoom-in-95 duration-300 my-auto overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
              <div className="flex items-center space-x-8">
                <div className={`w-28 h-28 rounded-[36px] flex items-center justify-center text-5xl font-black shadow-xl border-4 border-white dark:border-gray-800 ${selectedUser.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  {selectedUser.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-3">{selectedUser.fullName || 'Member Profile'}</h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedUser.email}</p>
                    <div className="flex bg-gray-50 dark:bg-dark p-1 rounded-xl">
                      <button onClick={() => downloadUserReport('csv')} className="px-3 py-1.5 text-[8px] font-black text-primary uppercase hover:bg-white dark:hover:bg-secondary rounded-lg transition-all">CSV Report</button>
                      <button onClick={() => downloadUserReport('pdf')} className="px-3 py-1.5 text-[8px] font-black text-primary uppercase hover:bg-white dark:hover:bg-secondary rounded-lg transition-all ml-1">PDF Report</button>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-16 h-16 bg-gray-50 dark:bg-dark rounded-[28px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-90">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-16">
              <div className="space-y-12">
                <div className="p-10 bg-gray-50 dark:bg-dark/50 rounded-[48px] border border-gray-100 dark:border-gray-800">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10 text-center md:text-left">Access Governance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN].map(role => (
                      <button
                        key={role}
                        disabled={updatingRole || selectedUser.role === role}
                        onClick={() => handleUpdateRole(role)}
                        className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all group ${
                          selectedUser.role === role 
                            ? 'bg-primary border-primary text-white shadow-[0_15px_30px_rgba(59,130,246,0.3)]' 
                            : 'bg-white dark:bg-secondary border-transparent text-gray-400 hover:border-primary/20'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${selectedUser.role === role ? 'bg-white/20' : 'bg-gray-50 dark:bg-dark'}`}>
                           <i className={`fas ${role === 'admin' ? 'fa-crown' : role === 'moderator' ? 'fa-shield-halved' : 'fa-user'} text-lg`}></i>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="p-10 bg-gray-50 dark:bg-dark/50 rounded-[48px] text-center border border-gray-100 dark:border-gray-800 shadow-inner group">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Wallet Assets</p>
                      <p className="text-4xl font-black text-primary leading-none">{userAssets.cards.length}</p>
                   </div>
                   <div className="p-10 bg-gray-50 dark:bg-dark/50 rounded-[48px] text-center border border-gray-100 dark:border-gray-800 shadow-inner group">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Vault Items</p>
                      <p className="text-4xl font-black text-primary leading-none">{userAssets.docs.length}</p>
                   </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-gray-50 dark:bg-dark/50 rounded-[48px] p-10 border border-gray-100 dark:border-gray-800 space-y-8 shadow-sm">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Registry Information</h3>
                   <div className="space-y-6">
                     <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Compliance</span>
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${selectedUser.status === 'verified' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'}`}>{selectedUser.status}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Birth Date</span>
                        <span className="text-sm font-bold">{selectedUser.dob || 'Not Provided'}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Enrolled</span>
                        <span className="text-sm font-bold">{selectedUser.createdAt ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                     </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button onClick={() => handleDeleteUser(selectedUser.uid)} className="w-full py-6 bg-red-50 dark:bg-red-900/10 text-red-500 font-black rounded-[32px] text-[10px] uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5 active:scale-95">Revoke Account Access</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
