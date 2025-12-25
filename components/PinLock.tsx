
import React, { useState } from 'react';
import { useAuth } from '../App';
import { auth } from '../firebase';

const PinLock: React.FC = () => {
  const { profile, setUnlocked } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      // Auto-check when reaching PIN length (assuming it matches profile.appPin length)
      if (profile?.appPin && newPin === profile.appPin) {
        setUnlocked(true);
      } else if (profile?.appPin && newPin.length === profile.appPin.length) {
        setTimeout(() => {
          setPin('');
          setError(true);
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark z-[1000] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
           <i className="fas fa-lock text-3xl"></i>
        </div>
        <h2 className="text-2xl font-black mb-2">App Locked</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enter Security PIN to Proceed</p>
      </div>

      <div className="flex space-x-4 mb-12">
        {[...Array(profile?.appPin?.length || 4)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              i < pin.length 
                ? 'bg-primary border-primary scale-125 shadow-lg shadow-primary/30' 
                : 'border-gray-200 dark:border-gray-800'
            } ${error ? 'bg-red-500 border-red-500 animate-shake' : ''}`}
          ></div>
        ))}
      </div>

      {error && <p className="text-red-500 font-bold text-xs mb-8 uppercase tracking-widest animate-bounce">Incorrect PIN</p>}

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button 
            key={num} 
            onClick={() => handleKeyPress(num)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 dark:bg-secondary flex items-center justify-center text-xl font-black hover:bg-primary hover:text-white transition-all active:scale-90"
          >
            {num}
          </button>
        ))}
        <button onClick={() => auth.signOut()} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xs font-black text-red-500 uppercase tracking-widest">Exit</button>
        <button 
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 dark:bg-secondary flex items-center justify-center text-xl font-black hover:bg-primary hover:text-white transition-all active:scale-90"
        >
          0
        </button>
        <button 
          onClick={handleDelete}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
        >
          <i className="fas fa-backspace text-xl"></i>
        </button>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PinLock;
