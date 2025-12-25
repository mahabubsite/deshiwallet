
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
    <div className="space-y-8">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-2xl font-black">Member Governance</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Directory size: {users.length}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-64">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input
                type="text"
                placeholder="Search identity..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)}
              className="bg-gray-50 dark:bg-dark px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="admin">Admins</option>
              <option value="moderator">Moderators</option>
              <option value="user">Users</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-gray-50 dark:bg-dark px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-none outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Authority</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="group hover:bg-gray-50/50 dark:hover:bg-dark/20 transition-all cursor-pointer" onClick={() => viewUserProfile(user)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${user.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                          {user.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-white">{user.fullName || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        user.status === VerificationStatus.VERIFIED ? 'bg-emerald-50 text-emerald-500' : 
                        user.status === VerificationStatus.PENDING ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`text-[10px] font-black uppercase ${user.role === 'admin' ? 'text-amber-500' : user.role === 'moderator' ? 'text-indigo-400' : 'text-gray-400'}`}>
                         <i className={`fas ${user.role === 'admin' ? 'fa-crown' : user.role === 'moderator' ? 'fa-shield' : 'fa-user'} mr-1.5`}></i>
                         {user.role}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="w-8 h-8 bg-gray-50 dark:bg-dark rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all ml-auto">
                        <i className="fas fa-chevron-right text-[10px]"></i>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-20 text-center">
                <i className="fas fa-user-slash text-4xl text-gray-100 mb-4"></i>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No users found matching filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center px-4 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-secondary w-full max-w-5xl rounded-[48px] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 my-8">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center space-x-6">
                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl font-black shadow-xl ${selectedUser.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  {selectedUser.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 dark:text-white leading-tight">{selectedUser.fullName || 'Member Profile'}</h2>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedUser.email}</p>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <p className="text-[10px] font-black text-primary uppercase">ID: {selectedUser.uid.substring(0, 8)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-14 h-14 bg-gray-50 dark:bg-dark rounded-[24px] flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-12">
              <div className="space-y-10">
                {/* Role Promotion Section */}
                <div className="p-8 bg-gray-50 dark:bg-dark/50 rounded-[40px] border border-gray-100 dark:border-gray-800">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Access Governance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN].map(role => (
                      <button
                        key={role}
                        disabled={updatingRole || selectedUser.role === role}
                        onClick={() => handleUpdateRole(role)}
                        className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${
                          selectedUser.role === role 
                            ? 'bg-primary border-primary text-white shadow-lg' 
                            : 'bg-white dark:bg-secondary border-transparent text-gray-400 hover:border-primary/20'
                        }`}
                      >
                        <i className={`fas ${role === 'admin' ? 'fa-crown' : role === 'moderator' ? 'fa-shield-halved' : 'fa-user'} text-lg mb-2`}></i>
                        <span className="text-[10px] font-black uppercase">{role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-8 bg-gray-50 dark:bg-dark/50 rounded-[40px] text-center border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Wallet Assets</p>
                      <p className="text-3xl font-black text-primary">{userAssets.cards.length}</p>
                   </div>
                   <div className="p-8 bg-gray-50 dark:bg-dark/50 rounded-[40px] text-center border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Vault Items</p>
                      <p className="text-3xl font-black text-primary">{userAssets.docs.length}</p>
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Identity Information</h3>
                <div className="bg-gray-50 dark:bg-dark/50 rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 space-y-6">
                   <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Compliance</span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${selectedUser.status === 'verified' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>{selectedUser.status}</span>
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

                <div className="flex space-x-4 pt-6">
                   <button onClick={() => handleDeleteUser(selectedUser.uid)} className="flex-1 py-5 bg-red-50 text-red-500 font-black rounded-3xl text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Revoke Account Access</button>
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
