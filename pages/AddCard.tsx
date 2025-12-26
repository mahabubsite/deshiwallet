
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Router from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { BankCard } from '../types';

const { useNavigate, useParams } = Router as any;

const BANGLADESHI_BANKS = [
  "Sonali Bank", "Janata Bank", "Agrani Bank", "Rupali Bank", "Islami Bank Bangladesh", 
  "Dutch-Bangla Bank (DBBL)", "BRAC Bank", "City Bank", "Eastern Bank (EBL)", 
  "Mutual Trust Bank (MTB)", "Prime Bank", "Southeast Bank", "Trust Bank", 
  "Bank Asia", "Standard Chartered Bangladesh", "HSBC Bangladesh", "Dhaka Bank", 
  "NCC Bank", "United Commercial Bank (UCB)", "Al-Arafah Islami Bank", 
  "Social Islami Bank", "EXIM Bank", "Shahjalal Islami Bank", "Pubali Bank", 
  "Uttara Bank", "AB Bank", "IFIC Bank", "Mercantile Bank", "Jamuna Bank", 
  "One Bank", "Premier Bank", "First Security Islami Bank", 
  "South Bangla Agriculture & Commerce Bank", "NRB Bank", "NRB Commercial Bank", 
  "Modhumoti Bank", "Midland Bank", "Meghna Bank", "Union Bank", "Standard Bank", 
  "Global Islami Bank", "Community Bank Bangladesh", "Bengal Commercial Bank", 
  "Citizens Bank"
].sort();

export const STATIC_CARD_DESIGNS = [
  { id: 'default', name: 'Pacific Deep', class: 'bg-gradient-to-br from-blue-600 to-indigo-900' },
  { id: 'dark', name: 'Obsidian Matte', class: 'bg-gradient-to-br from-gray-900 to-black' },
  { id: 'royal', name: 'Royal Velvet', class: 'bg-gradient-to-br from-purple-900 to-blue-900' },
  { id: 'gold', name: 'Gold Aurum', class: 'bg-gradient-to-br from-amber-400 to-yellow-800' },
  { id: 'rose', name: 'Rose Quartz', class: 'bg-gradient-to-br from-rose-400 to-purple-700' },
  { id: 'emerald', name: 'Emerald Forest', class: 'bg-gradient-to-br from-emerald-500 to-green-900' },
  { id: 'crimson', name: 'Crimson Peak', class: 'bg-gradient-to-br from-red-600 to-maroon-900' },
  { id: 'sunset', name: 'Dhaka Sunset', class: 'bg-gradient-to-tr from-orange-400 to-purple-800' }
];

const AddCard: React.FC<{ isEdit?: boolean }> = ({ isEdit }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  const bankRef = useRef<HTMLDivElement>(null);
  const [dbDesigns, setDbDesigns] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bankName: '',
    holderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    pin: '',
    paymentMethod: 'Visa' as 'Visa' | 'MasterCard' | 'Amex' | 'Nexus',
    design: 'default'
  });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'cardDesigns'), (snap) => {
      setDbDesigns(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((d: any) => d.active));
    });
    return unsub;
  }, [user]);

  const allDesigns = [...STATIC_CARD_DESIGNS, ...dbDesigns];

  useEffect(() => {
    if (isEdit && id) {
      const fetchCard = async () => {
        const cardDoc = await getDoc(doc(db, 'cards', id));
        if (cardDoc.exists()) {
          const data = cardDoc.data() as BankCard;
          setFormData({ 
            bankName: data.bankName, 
            holderName: data.holderName, 
            cardNumber: data.cardNumber, 
            expiryDate: data.expiryDate, 
            cvv: data.cvv, 
            pin: data.pin || '', 
            paymentMethod: data.paymentMethod, 
            design: data.design 
          });
          setBankSearch(data.bankName);
        }
      };
      fetchCard();
    }
  }, [id, isEdit]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) {
        setShowBankList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBanks = useMemo(() => {
    const term = bankSearch.toLowerCase();
    return BANGLADESHI_BANKS.filter(bank => bank.toLowerCase().includes(term));
  }, [bankSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.bankName) return;
    setLoading(true);
    try {
      if (isEdit && id) {
        await updateDoc(doc(db, 'cards', id), { ...formData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'cards'), { ...formData, userId: user.uid, createdAt: serverTimestamp() });
      }
      navigate('/');
    } catch (err) {
      alert('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const currentDesign = allDesigns.find(d => d.id === formData.design) || allDesigns[0];

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 pb-32 animate-in fade-in duration-300">
      <div className="flex items-center space-x-6 mb-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 hover:text-primary transition-all">
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{isEdit ? 'Update Asset' : 'Register Asset'}</h1>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Premium Wallet Entry</p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12 items-start">
        <div className="mb-10 lg:sticky lg:top-24 max-w-lg mx-auto w-full">
          <div className={`relative w-full aspect-[1.586/1] rounded-2xl p-8 text-white shadow-2xl overflow-hidden transition-all duration-300 ${currentDesign?.class || 'bg-primary'}`}>
            <div className="h-full flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter uppercase drop-shadow-sm truncate max-w-[180px]">{formData.bankName || 'BANKING...'}</span>
                  <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em]">Secure Asset</p>
                </div>
                <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-md border border-white/20 shadow-sm"></div>
              </div>
              <p className="text-2xl font-black tracking-[0.25em] drop-shadow-md">{formData.cardNumber ? formData.cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}</p>
              <div className="flex justify-between items-end">
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase opacity-60 tracking-widest mb-1">HOLDER</p>
                  <p className="text-sm font-bold uppercase tracking-widest truncate max-w-[180px] drop-shadow-sm">{formData.holderName || 'PENDING ENTRY'}</p>
                </div>
                {formData.paymentMethod === 'Nexus' ? (
  <span className="text-sm font-black tracking-widest px-3 py-1 border border-white/60 rounded-md">
    NEXUS
  </span>
) : (
  <i className={`fab fa-cc-${formData.paymentMethod.toLowerCase()} text-4xl opacity-90 drop-shadow-sm`}></i>
)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto lg:max-w-full w-full">
          <div className="bg-white dark:bg-secondary p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 border-b border-gray-50 dark:border-gray-800 pb-4">Identification Matrix</h3>
            <div className="grid gap-6">
              {/* Bank Searchable Selection */}
              <div className="relative" ref={bankRef}>
                <div className="border-l-4 border-primary/20 pl-5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Banking Institution</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-transparent border-b-2 border-gray-50 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors"
                      placeholder="Search or enter bank name..."
                      value={bankSearch}
                      onFocus={() => setShowBankList(true)}
                      onChange={(e) => {
                        setBankSearch(e.target.value);
                        setFormData({...formData, bankName: e.target.value});
                      }}
                    />
                    <i className="fas fa-search absolute right-0 bottom-3 text-gray-300 text-xs"></i>
                  </div>
                </div>
                
                {showBankList && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl z-[50] max-h-60 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2">
                    <div className="p-2 border-b border-gray-50 dark:border-gray-800">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">Select from Bangladeshi Banks</p>
                    </div>
                    {filteredBanks.map(bank => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, bankName: bank});
                          setBankSearch(bank);
                          setShowBankList(false);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none"
                      >
                        {bank}
                      </button>
                    ))}
                    {filteredBanks.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-[10px] font-bold text-gray-400">No match. Entry will be saved as "{bankSearch}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-l-4 border-primary/20 pl-5">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Legal Holder Name</label>
                <input type="text" required className="w-full bg-transparent border-b-2 border-gray-50 dark:border-gray-800 outline-none font-bold text-sm py-2 uppercase focus:border-primary transition-colors" value={formData.holderName} onChange={e => setFormData({ ...formData, holderName: e.target.value })} />
              </div>

              <div className="border-l-4 border-primary/20 pl-5">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Card Index Number</label>
                <input type="text" maxLength={16} required className="w-full bg-transparent border-b-2 border-gray-50 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors" value={formData.cardNumber} onChange={e => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, '') })} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border-l-4 border-primary/20 pl-5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Expiration (MM/YY)</label>
                  <input type="text" placeholder="MM/YY" maxLength={5} required className="w-full bg-transparent border-b-2 border-gray-50 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors" value={formData.expiryDate} onChange={e => { let val = e.target.value.replace(/\D/g, ''); if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4); setFormData({ ...formData, expiryDate: val }); }} />
                </div>
                <div className="border-l-4 border-primary/20 pl-5">
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Security CVV</label>
                  <input type="password" maxLength={4} required className="w-full bg-transparent border-b-2 border-gray-50 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors" value={formData.cvv} onChange={e => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>

              <div className="border-l-4 border-primary/20 pl-5">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Access PIN (Optional)</label>
                <input type="password" maxLength={6} className="w-full bg-transparent border-b-2 border-gray-50 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} placeholder="••••" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Visual Environment</h3>
             <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
                {allDesigns.map(design => (
                  <button key={design.id} type="button" onClick={() => setFormData({ ...formData, design: design.id })} className={`aspect-square transition-all border-4 rounded-lg ${formData.design === design.id ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-60'} ${design.class}`}></button>
                ))}
             </div>
             <div className="flex gap-2">
                {['Visa', 'MasterCard', 'Amex', 'Nexus'].map(m => (
                  <button key={m} type="button" onClick={() => setFormData({ ...formData, paymentMethod: m as any })} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl border-2 transition-all ${formData.paymentMethod === m ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}>{m}</button>
                ))}
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]">
            {loading ? 'SYNCHRONIZING...' : (isEdit ? 'UPDATE ASSET' : 'COMMIT TO VAULT')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCard;
