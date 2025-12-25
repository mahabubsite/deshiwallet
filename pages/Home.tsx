
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { BankCard, VerificationStatus, UserRole } from '../types';
import { STATIC_CARD_DESIGNS } from './AddCard';

const { Link, useNavigate } = Router as any;

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

const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [dbDesigns, setDbDesigns] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'systemConfig', 'main'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'cardDesigns'), (snap) => {
      setDbDesigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'cards'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankCard));
      setCards(cardList);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (loading || cards.length === 0 || !user) return;
    const triggerExpiryNotifications = async () => {
      for (const card of cards) {
        const status = getExpiryStatus(card.expiryDate);
        if (status === 'soon') {
          const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('title', '==', `Card Expiring Soon: ${card.bankName}`));
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, 'notifications'), {
              userId: user.uid,
              title: `Card Expiring Soon: ${card.bankName}`,
              message: `Your ${card.paymentMethod} card ending in ${card.cardNumber.slice(-4)} is expiring on ${card.expiryDate}.`,
              read: false,
              createdAt: serverTimestamp()
            });
          }
        }
      }
    };
    triggerExpiryNotifications();
  }, [cards, loading, user]);

  const filteredCards = cards.filter(c => 
    c.bankName.toLowerCase().includes(search.toLowerCase()) ||
    c.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const allPossibleDesigns = [...STATIC_CARD_DESIGNS, ...dbDesigns];

  const CardUI: React.FC<{ card: BankCard; className?: string }> = ({ card, className = "" }) => {
    const design = allPossibleDesigns.find(d => d.id === card.design) || STATIC_CARD_DESIGNS[0];
    const expiryStatus = getExpiryStatus(card.expiryDate);
    
    return (
      <div 
        onClick={() => navigate(`/card/${card.id}`)}
        className={`relative w-full aspect-[1.586/1] rounded-2xl p-6 sm:p-8 text-white shadow-xl cursor-pointer overflow-hidden transition-transform duration-200 hover:scale-[1.01] ${design.class || 'bg-primary'} ${className}`}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        {expiryStatus !== 'valid' && (
          <div className={`absolute top-0 left-0 right-0 px-4 py-1 z-20 flex items-center justify-center space-x-2 border-b border-white/10 ${expiryStatus === 'expired' ? 'bg-red-600/90' : 'bg-amber-600/90'} backdrop-blur-sm`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-white">{expiryStatus === 'expired' ? 'Expired Asset' : 'Expiry Imminent'}</span>
          </div>
        )}
        <div className="h-full flex flex-col justify-between relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase leading-none mb-1 drop-shadow-sm">{card.bankName}</span>
              <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">Premium Vault</span>
            </div>
            <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-md border border-white/20"></div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <p className="text-xl sm:text-2xl font-black tracking-[0.2em] drop-shadow-sm">•••• •••• •••• {card.cardNumber.slice(-4)}</p>
            <div className="flex justify-between items-end">
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase opacity-50 tracking-widest leading-none mb-1">HOLDER</p>
                <p className="text-sm font-black uppercase tracking-widest truncate max-w-[140px] drop-shadow-sm">{card.holderName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[8px] font-bold uppercase opacity-50 leading-none mb-1">EXP</p>
                <p className="text-xs font-black italic drop-shadow-sm">{card.expiryDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showAddCard = profile?.role === UserRole.ADMIN || (config?.features?.addCard !== false);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 animate-in fade-in duration-300">
      {profile?.role === UserRole.ADMIN && (
        <Link to="/admin" className="block mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between hover:bg-primary/20 transition-all max-w-4xl mx-auto lg:max-w-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-user-shield"></i>
            </div>
            <div>
              <p className="text-xs font-black text-primary uppercase">Admin Portal</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">System Override Active</p>
            </div>
          </div>
          <i className="fas fa-arrow-right text-primary text-xs"></i>
        </Link>
      )}

      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto lg:max-w-full">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">My Wallet</h1>
          <div className="flex items-center mt-1">
            {profile?.status === VerificationStatus.VERIFIED ? (
              <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase flex items-center">
                <i className="fas fa-check-circle mr-1.5"></i> Verified Identity
              </span>
            ) : (
              <Link to="/verify" className="text-[9px] font-black tracking-widest text-amber-500 uppercase flex items-center hover:underline decoration-2 underline-offset-4">
                <i className="fas fa-exclamation-triangle mr-1.5"></i> Action Required
              </Link>
            )}
          </div>
        </div>
        {showAddCard && (
          <Link to="/add-card" className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <i className="fas fa-plus"></i>
          </Link>
        )}
      </div>

      <div className="mb-10 max-w-4xl mx-auto lg:max-w-full">
        <div className="relative">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
            type="text"
            placeholder="SEARCH WALLET ASSETS..."
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-secondary rounded-xl border border-gray-100 dark:border-gray-800 outline-none font-bold text-xs tracking-widest focus:ring-4 focus:ring-primary/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-secondary rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 max-w-4xl mx-auto lg:max-w-full">
          <div className="w-16 h-16 bg-gray-50 dark:bg-dark rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200">
             <i className="fas fa-credit-card text-2xl"></i>
          </div>
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Vault Sector Empty</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map(card => <CardUI key={card.id} card={card} />)}
        </div>
      )}
    </div>
  );
};

export default Home;
