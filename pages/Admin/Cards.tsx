
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BankCard } from '../../types';

const AdminCards: React.FC = () => {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cards'), (snap) => {
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as BankCard)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const getBankDistribution = () => {
    const counts: Record<string, number> = {};
    cards.forEach(c => {
      counts[c.bankName] = (counts[c.bankName] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const handleExportCSV = () => {
    let csv = "Bank,Holder,Card Number (Partial),Method,Created\n";
    cards.forEach(c => {
      csv += `${c.bankName},${c.holderName},•••• •••• •••• ${c.cardNumber.slice(-4)},${c.paymentMethod},${c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cards_Report_${Date.now()}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const distribution = getBankDistribution();

    const html = `
      <html>
        <head>
          <title>Card Analytics Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; }
            h2 { font-size: 14px; text-transform: uppercase; color: #64748b; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
            .bank-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>DeshiWallet Card Analytics</h1>
          <p>Total Managed Assets: ${cards.length}</p>

          <h2>Bank Distribution Matrix</h2>
          <div style="margin-top: 20px;">
            ${distribution.map(([bank, count]) => `
              <div class="bank-row">
                <span style="font-weight:bold;">${bank}</span>
                <span>${count} cards (${((count / cards.length) * 100).toFixed(1)}%)</span>
              </div>
            `).join('')}
          </div>

          <h2>Detailed Registry</h2>
          <table>
            <tr><th>Bank</th><th>Holder</th><th>Method</th><th>Joined</th></tr>
            ${cards.map(c => `<tr><td>${c.bankName}</td><td>${c.holderName}</td><td>${c.paymentMethod}</td><td>${c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-white dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1">Card Monitoring</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System-wide managed assets: {cards.length}</p>
          </div>
          <div className="flex space-x-3">
             <button onClick={handleExportCSV} className="px-5 py-3 bg-gray-50 dark:bg-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">CSV Report</button>
             <button onClick={handleExportPDF} className="px-5 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">PDF Analytics</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                    <th className="pb-4 px-4">Bank</th>
                    <th className="pb-4 px-4">Holder</th>
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
                          <span className="text-sm font-bold truncate max-w-[120px]">{c.bankName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-gray-500 uppercase">{c.holderName}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase ${c.paymentMethod === 'Visa' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>{c.paymentMethod}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => deleteDoc(doc(db, 'cards', c.id))} className="text-red-400 hover:text-red-600 transition-colors">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-dark/50 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Market Distribution</h3>
            <div className="space-y-4">
              {getBankDistribution().slice(0, 8).map(([bank, count], i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{bank}</span>
                   </div>
                   <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{count}</span>
                </div>
              ))}
              {getBankDistribution().length > 8 && <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-widest mt-4">And {getBankDistribution().length - 8} more institutions</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCards;
