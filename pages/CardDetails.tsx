
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { doc, getDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { BankCard } from '../types';
import { STATIC_CARD_DESIGNS } from './AddCard';

const { useParams, useNavigate } = Router as any;

const getExpiryStatus = (expiryDate: string): 'expired' | 'soon' | 'valid' => {
  if (!expiryDate || !expiryDate.includes('/')) return 'valid';
  const [m, y] = expiryDate.split('/').map(Number);
  if (isNaN(m) || isNaN(y)) return 'valid';
  const now = new Date();
  const expiry = new Date(2000 + y, m, 0, 23, 59, 59);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'valid';
};

const CardDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [card, setCard] = useState<BankCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbDesigns, setDbDesigns] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    const fetchCard = async () => {
      const cardDoc = await getDoc(doc(db, 'cards', id));
      if (cardDoc.exists()) {
        setCard({ id: cardDoc.id, ...cardDoc.data() } as BankCard);
      }
      setLoading(false);
    };
    fetchCard();
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'cardDesigns'), (snap) => {
      setDbDesigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    let timer: any;
    if (revealSensitive) {
      timer = setTimeout(() => setRevealSensitive(false), 10000);
    }
    return () => clearTimeout(timer);
  }, [revealSensitive]);

  const handleDelete = async () => {
    if (window.confirm('Delete this premium card from your wallet? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'cards', id!));
        navigate('/');
      } catch (err) {
        alert('Failed to delete card');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!card) return <div className="text-center py-20 text-gray-500 font-bold">Premium card entry not found.</div>;

  const allDesigns = [...STATIC_CARD_DESIGNS, ...dbDesigns];
  const design = allDesigns.find(d => d.id === card.design) || STATIC_CARD_DESIGNS[0];
  const expiryStatus = getExpiryStatus(card.expiryDate);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 overflow-hidden">
      <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto lg:max-w-full">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="flex space-x-2">
          <button onClick={() => navigate(`/edit-card/${card.id}`)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-500 shadow-sm"><i className="fas fa-edit"></i></button>
          <button onClick={handleDelete} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-red-500 shadow-sm"><i className="fas fa-trash-alt"></i></button>
        </div>
      </div>

      {expiryStatus !== 'valid' && (
        <div className={`max-w-2xl mx-auto lg:max-w-full mb-8 p-6 rounded-[32px] flex items-center space-x-6 border animate-in slide-in-from-top-4 ${
          expiryStatus === 'expired' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
            expiryStatus === 'expired' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            <i className={`fas ${expiryStatus === 'expired' ? 'fa-calendar-xmark' : 'fa-calendar-clock'}`}></i>
          </div>
          <div>
            <h4 className="font-black uppercase text-[10px] tracking-widest opacity-60">Security Alert</h4>
            <p className="font-bold text-sm">
              {expiryStatus === 'expired' 
                ? 'This card has expired and may no longer be accepted for payments.' 
                : `This card is expiring very soon (on ${card.expiryDate}). Please update your card details.`}
            </p>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
        {/* Card Interaction Container */}
        <div className="perspective-1000 mb-10 w-full max-w-2xl mx-auto lg:max-w-full lg:mb-0">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full aspect-[1.586/1] transition-transform duration-[0.8s] preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* FRONT SIDE */}
            <div className={`absolute inset-0 backface-hidden rounded-[28px] sm:rounded-[40px] p-8 sm:p-10 text-white shadow-2xl overflow-hidden ${design.class}`}>
              <div className="h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none mb-1">{card.bankName}</span>
                    <span className="text-[7px] sm:text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">SECURE DIGITAL VAULT</span>
                  </div>
                  <div className="w-12 h-9 sm:w-16 sm:h-12 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-lg shadow-inner"></div>
                </div>
                <div className="space-y-6">
                  {revealSensitive ? (
                    <p className="text-xl sm:text-2xl font-black tracking-[0.15em]">{card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}</p>
                  ) : (
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4].map(g => <div key={g} className="flex space-x-1"><div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div><div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div><div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div><div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div></div>)}
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[7px] sm:text-[10px] font-bold opacity-50">CARD HOLDER</p>
                      <p className="text-sm sm:text-xl font-black uppercase tracking-widest">{card.holderName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] sm:text-[10px] font-bold opacity-50">EXPIRES</p>
                      <p className={`text-sm sm:text-lg font-black ${expiryStatus !== 'valid' ? 'text-amber-200' : ''}`}>{card.expiryDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[28px] sm:rounded-[40px] text-white shadow-2xl overflow-hidden ${design.class} border-2 border-white/10`}>
              <div className="w-full h-12 sm:h-16 bg-black/80 mt-12"></div>
              <div className="px-8 sm:px-12 mt-10">
                <div className="flex items-center space-x-8">
                  <div className="flex-grow h-10 bg-white/20 rounded-lg flex items-center px-4 italic text-xs">Authorized Signature</div>
                  <div className="w-20 h-10 bg-white rounded-lg flex items-center justify-center text-dark font-black text-xl">{revealSensitive ? card.cvv : '•••'}</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-6 text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Tap card to flip</p>
        </div>

        {/* PC Settings Panel */}
        <div className="space-y-6 max-w-2xl mx-auto lg:max-w-full">
          <div className="bg-white dark:bg-secondary rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-black text-gray-800 dark:text-white mb-6 uppercase tracking-widest">Vault Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-dark rounded-[32px]">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${revealSensitive ? 'bg-primary text-white' : 'bg-white dark:bg-secondary text-gray-400'}`}>
                    <i className={`fas ${revealSensitive ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Toggle Sensitive Data</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase">Auto-hide in 10s</p>
                  </div>
                </div>
                <button onClick={() => setRevealSensitive(!revealSensitive)} className={`w-14 h-8 rounded-full transition-all relative ${revealSensitive ? 'bg-primary' : 'bg-gray-200 dark:bg-secondary'}`}>
                  <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${revealSensitive ? 'left-7.5' : 'left-1.5'}`}></div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 dark:bg-dark rounded-[32px] text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Security CVV</p>
                  <p className="text-2xl font-black text-primary tracking-widest">{revealSensitive ? card.cvv : '•••'}</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-dark rounded-[32px] text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Vault PIN</p>
                  <p className="text-2xl font-black text-primary tracking-widest">{revealSensitive ? (card.pin || 'N/A') : '••••'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button onClick={() => navigate(`/edit-card/${card.id}`)} className="flex-1 py-5 bg-primary text-white font-black rounded-[28px] uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Edit Details</button>
            <button onClick={handleDelete} className="flex-1 py-5 bg-red-50 text-red-500 font-black rounded-[28px] uppercase text-[10px] tracking-widest border border-red-100">Delete Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetails;
