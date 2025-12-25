
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { Notification } from '../types';

const { useParams, useNavigate } = Router as any;

const NotificationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notif, setNotif] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const fetchNotif = async () => {
      try {
        const docRef = doc(db, 'notifications', id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Notification;
          setNotif(data);
          
          // Auto-mark as read
          if (!data.read) {
            await updateDoc(docRef, { read: true });
          }
        }
      } catch (err) {
        console.error("Error fetching notification:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotif();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!notif) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <i className="fas fa-exclamation-circle text-4xl text-gray-200 mb-4"></i>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Notification not found</p>
        <button onClick={() => navigate('/notifications')} className="mt-4 text-primary font-black text-sm uppercase">Back to Alerts</button>
      </div>
    );
  }

  // Normalize images into an array
  const displayImages = notif.images && notif.images.length > 0 
    ? notif.images 
    : (notif.imageUrl ? [notif.imageUrl] : []);

  return (
    <div className="w-full max-w-4xl mx-auto px-0 md:px-4 py-0 md:py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-secondary md:mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/notifications')} 
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-primary transition-all"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Notification</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Recent'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary border-0 md:border md:border-gray-100 dark:md:border-gray-800">
        {/* CAROUSEL / IMAGE VIEWER */}
        {displayImages.length > 0 && (
          <div className="relative w-full bg-black flex items-center justify-center cursor-zoom-in group">
            <div 
              className="w-full max-h-[80vh] flex items-center justify-center overflow-hidden"
              onClick={() => setIsZoomed(true)}
            >
              <img 
                src={displayImages[activeImageIndex]} 
                className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]" 
                alt={`Update view ${activeImageIndex + 1}`} 
              />
            </div>

            {/* Hint for zoom */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <i className="fas fa-search-plus mr-2"></i> Click to Zoom
            </div>
            
            {displayImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1)); }}
                  className="absolute left-4 w-10 h-10 rounded-none bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-all z-10"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1)); }}
                  className="absolute right-4 w-10 h-10 rounded-none bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-all z-10"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {displayImages.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 transition-all ${idx === activeImageIndex ? 'bg-primary w-8' : 'bg-white/40 w-4'}`}
                    ></div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-6 md:p-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-10 h-10 flex items-center justify-center text-lg ${notif.userId === 'admin_alert' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
              <i className={`fas ${notif.userId === 'global' ? 'fa-bullhorn' : notif.userId === 'admin_alert' ? 'fa-user-shield' : 'fa-bell'}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Channel</p>
              <p className="text-[10px] font-bold text-primary uppercase">Security Priority: High</p>
            </div>
          </div>

          <h2 className="text-2xl font-black mb-6 leading-tight text-gray-900 dark:text-white">
            {notif.title}
          </h2>

          <div className="border-l-2 border-primary/20 pl-6 my-8">
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
              {notif.message}
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">REFERENCE ID: {notif.id.substring(0, 12).toUpperCase()}</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate('/notifications')} 
                className="flex-1 md:flex-none px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all"
              >
                Back to Inbox
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN ZOOM VIEW (LIGHTBOX) */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center cursor-zoom-out p-4 md:p-10"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors text-2xl"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
          >
            <i className="fas fa-times"></i>
          </button>
          
          <img 
            src={displayImages[activeImageIndex]} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
            alt="Zoomed View" 
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
            <span className="bg-white/10 backdrop-blur-md px-6 py-2 text-white/80 text-[10px] font-black uppercase tracking-[0.4em]">
              Image {activeImageIndex + 1} of {displayImages.length}
            </span>
          </div>

          {displayImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1)); }}
                className="absolute left-6 w-14 h-14 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all z-20 text-xl"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1)); }}
                className="absolute right-6 w-14 h-14 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all z-20 text-xl"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDetail;
