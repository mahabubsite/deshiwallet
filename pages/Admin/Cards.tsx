
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BankCard } from '../../types';

const AdminCards: React.FC = () => {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cards'), (snap) => {
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as BankCard)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <h1 className="text-2xl font-black mb-1">Card Monitoring</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">System-wide card activity</p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                  <th className="pb-4 px-4">Bank</th>
                  <th className="pb-4 px-4">Holder</th>
                  <th className="pb-4 px-4">Card Number</th>
                  <th className="pb-4 px-4">Method</th>
                  <th className="pb-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {cards.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-dark/30 transition-all">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                          <i className="fas fa-university text-xs"></i>
                        </div>
                        <span className="text-sm font-bold">{c.bankName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">{c.holderName}</td>
                    <td className="py-4 px-4 text-sm font-mono text-gray-400 tracking-wider">
                      •••• •••• •••• {c.cardNumber.slice(-4)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-dark rounded-md uppercase">{c.paymentMethod}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => deleteDoc(doc(db, 'cards', c.id))} className="text-red-400 hover:text-red-600">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCards;
