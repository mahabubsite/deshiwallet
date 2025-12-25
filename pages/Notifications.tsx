
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { Notification, UserRole } from '../types';
import * as Router from 'react-router-dom';

const { useNavigate } = Router as any;

const Notifications: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const allowedTargets = [user.uid, 'global'];
    if (profile?.role === UserRole.ADMIN) allowedTargets.push('admin_alert');
    const q = query(collection(db, 'notifications'), where('userId', 'in', allowedTargets));
    const unsub = onSnapshot(q, (snap) => {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      if (profile?.createdAt) {
        const userJoinedAt = profile.createdAt.seconds;
        docs = docs.filter(n => n.userId === 'global' ? (n.createdAt?.seconds || 0) >= userJoinedAt : true);
      }
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(docs);
      setLoading(false);
    });
    return unsub;
  }, [user, profile]);

  const markAllAsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 pb-24 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-10 max-w-4xl mx-auto lg:max-w-full">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Alert Center</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Platform Intelligence</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead} className="text-[9px] font-black text-gray-400 hover:text-primary uppercase tracking-widest border border-gray-100 dark:border-gray-800 px-5 py-3 rounded-xl transition-all hover:bg-white dark:hover:bg-secondary">Mark All Seen</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-secondary rounded-3xl border border-gray-100 dark:border-gray-800 max-w-4xl mx-auto lg:max-w-full shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-dark rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200">
             <i className="fas fa-bell-slash text-2xl"></i>
          </div>
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Inbox Matrix Clear</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto lg:max-w-full grid gap-3">
          {notifications.map(n => (
            <div key={n.id} onClick={() => navigate(`/notification/${n.id}`)} className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-6 ${!n.read ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white dark:bg-secondary border-gray-100 dark:border-gray-800 opacity-60 hover:opacity-100'}`}>
              <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border-2 ${!n.read ? 'border-primary text-primary bg-white dark:bg-dark shadow-sm' : 'border-gray-100 text-gray-400'}`}>
                <i className={`fas ${n.userId === 'global' ? 'fa-bullhorn' : n.userId === 'admin_alert' ? 'fa-user-shield' : 'fa-envelope'} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-[11px] font-black uppercase tracking-widest truncate ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{n.title}</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tight">{n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : 'LOGGED: RECENT'}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>}
              <i className="fas fa-chevron-right text-[8px] text-gray-300"></i>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
