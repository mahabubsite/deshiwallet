
import React, { useState } from 'react';
import * as Router from 'react-router-dom';
import { useAuth } from '../../App';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const { useNavigate } = Router as any;

const ChangePin: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PIN entries do not match.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        appPin: pin
      });
      await refreshProfile();
      navigate('/settings');
    } catch (err) {
      setError('PIN synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto p-4 md:py-20">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tight">Security PIN</h1>
      </div>

      <div className="bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/5 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-lock-open text-2xl"></i>
          </div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Hardware Access Protection</p>
        </div>

        <form onSubmit={handleSave} className="space-y-10">
          {error && <p className="text-[10px] font-black text-red-500 text-center uppercase tracking-widest bg-red-50 p-3 border border-red-100">{error}</p>}
          
          <div className="grid grid-cols-1 gap-8">
            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Set New Access Token</label>
              <input 
                type="password"
                maxLength={6}
                className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-black text-3xl tracking-[0.8em] focus:border-primary transition-colors text-center md:text-left"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Confirm New Access Token</label>
              <input 
                type="password"
                maxLength={6}
                className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-black text-3xl tracking-[0.8em] focus:border-primary transition-colors text-center md:text-left"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-600 transition-all"
          >
            {loading ? 'ENCRYPTING PIN...' : 'SECURE VAULT NOW'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePin;
