
import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Notification } from '../../types';

const AdminNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetType, setTargetType] = useState('global');
  const [targetUserId, setTargetUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const qHistory = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    });

    return () => { unsubUsers(); unsubHistory(); };
  }, []);

  const handleSendOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);

    // Parse image URLs if multiple are provided (comma separated)
    const imagesArray = imageUrl.split(',').map(url => url.trim()).filter(url => url !== '');

    try {
      const payload = {
        title,
        message,
        imageUrl: imagesArray[0] || null,
        images: imagesArray,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'notifications', editingId), payload);
        alert('Notification updated!');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'notifications'), {
          ...payload,
          userId: targetType === 'global' ? 'global' : targetUserId,
          read: false,
          createdAt: serverTimestamp()
        });
        alert('Notification sent!');
      }
      setTitle('');
      setMessage('');
      setImageUrl('');
    } catch (e) {
      alert('Failed to process action.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    if (window.confirm('Delete this notification?')) {
      await deleteDoc(doc(db, 'notifications', id));
    }
  };

  const startEdit = (n: Notification) => {
    setEditingId(n.id);
    setTitle(n.title);
    setMessage(n.message);
    setImageUrl(n.images ? n.images.join(', ') : (n.imageUrl || ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <h1 className="text-2xl font-black mb-1">{editingId ? 'Edit Alert' : 'Broadcast Alerts'}</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Target users with push notifications</p>

        <form onSubmit={handleSendOrUpdate} className="space-y-6">
          {!editingId && (
            <div className="flex space-x-4">
               {['global', 'user'].map(type => (
                 <button 
                    key={type}
                    type="button" 
                    onClick={() => setTargetType(type)}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${targetType === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-dark text-gray-400 border-transparent'}`}
                 >
                    {type} Message
                 </button>
               ))}
            </div>
          )}

          {!editingId && targetType === 'user' && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Select User</label>
              <select className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm" value={targetUserId} onChange={e => setTargetUserId(e.target.value)} required={targetType === 'user'}>
                <option value="">Choose...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Alert Title</label>
              <input type="text" className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none font-bold text-sm" placeholder="Subject..." value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Image URLs (Comma separated for carousel)</label>
              <input type="text" className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none font-bold text-sm" placeholder="url1, url2, url3..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Message Content</label>
            <textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none font-medium text-sm min-h-[120px]" placeholder="Body..." value={message} onChange={e => setMessage(e.target.value)} required></textarea>
          </div>

          <div className="flex space-x-4">
             {editingId && <button type="button" onClick={() => { setEditingId(null); setTitle(''); setMessage(''); setImageUrl(''); }} className="flex-1 py-5 bg-gray-100 text-gray-400 font-black rounded-[32px] text-[10px] uppercase tracking-widest">Cancel</button>}
             <button type="submit" disabled={loading} className="flex-[2] py-5 bg-primary text-white font-black rounded-[32px] text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/30">
               {loading ? 'Processing...' : editingId ? 'Save Alert Changes' : 'Dispatch Notification'}
             </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Dispatch History</h3>
        <div className="grid gap-4">
          {history.map(n => (
            <div key={n.id} className="bg-white dark:bg-secondary p-6 rounded-[32px] border border-white dark:border-gray-800 flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${n.userId === 'global' ? 'bg-amber-50 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                    {n.imageUrl ? (
                      <img src={n.imageUrl} className="w-full h-full object-cover" alt="alert" />
                    ) : (
                      <i className={`fas ${n.userId === 'global' ? 'fa-bullhorn' : 'fa-user'}`}></i>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">{n.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium truncate max-w-md">{n.message}</p>
                  </div>
               </div>
               <div className="flex space-x-2">
                  <button onClick={() => startEdit(n)} className="w-9 h-9 bg-gray-50 dark:bg-dark rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all"><i className="fas fa-edit text-xs"></i></button>
                  <button onClick={() => deleteAlert(n.id)} className="w-9 h-9 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
