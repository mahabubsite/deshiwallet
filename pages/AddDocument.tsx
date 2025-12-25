
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { VaultDocument } from '../types';

const { useNavigate, useParams } = Router as any;

const CATEGORY_CONFIG: Record<string, { icon: string; fields: string[]; color: string }> = {
  'NID': { 
    icon: 'fa-id-card', 
    fields: ['NID Number', 'Full Name', "Father's Name", "Mother's Name", 'Date of Birth', 'Address'], 
    color: 'bg-emerald-600' 
  },
  'Passport': { 
    icon: 'fa-passport', 
    fields: ['Passport Number', 'Full Name', 'Expiry Date', 'Issue Date', 'Issuing Authority'], 
    color: 'bg-indigo-600' 
  },
  'Driving License': { 
    icon: 'fa-id-badge', 
    fields: ['License Number', 'Full Name', 'Vehicle Category', 'Expiry Date', 'Blood Group'], 
    color: 'bg-amber-600' 
  },
  'Medical Card': { 
    icon: 'fa-hospital-user', 
    fields: ['Member ID', 'Full Name', 'Blood Group', 'Emergency Contact', 'Provider'], 
    color: 'bg-red-600' 
  },
  'Passwords': { 
    icon: 'fa-key', 
    fields: ['Website/Service', 'Username', 'Secret Password', 'Notes'], 
    color: 'bg-slate-900' 
  },
  'Others': { 
    icon: 'fa-file-shield', 
    fields: ['Identification Title', 'Reference ID', 'Expiry (If any)'], 
    color: 'bg-primary' 
  }
};

const AddDocument: React.FC<{ isEdit?: boolean }> = ({ isEdit }) => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('NID');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dynamicFields, setDynamicFields] = useState<{key: string, value: string}[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      const fetchDoc = async () => {
        const docSnap = await getDoc(doc(db, 'documents', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as VaultDocument;
          setCategory(data.category);
          setTitle(data.title);
          setNotes(data.notes || '');
          const metadata = data.metadata || {};
          const mapped = Object.entries(metadata).map(([k, v]) => ({ key: k, value: v }));
          setDynamicFields(mapped);
        }
      };
      fetchDoc();
    } else {
      // Default fields for NID
      handleCategoryChange('NID');
    }
  }, [id, isEdit]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const defaults = CATEGORY_CONFIG[cat].fields.map(f => ({ key: f, value: '' }));
    setDynamicFields(defaults);
  };

  const addCustomField = () => {
    setDynamicFields([...dynamicFields, { key: 'Custom Field', value: '' }]);
  };

  const removeField = (index: number) => {
    setDynamicFields(dynamicFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<{key: string, value: string}>) => {
    const newFields = [...dynamicFields];
    newFields[index] = { ...newFields[index], ...updates };
    setDynamicFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title) return;
    setLoading(true);

    const metadata: Record<string, string> = {};
    dynamicFields.forEach(f => {
      if (f.key) metadata[f.key] = f.value;
    });

    try {
      if (isEdit && id) {
        await updateDoc(doc(db, 'documents', id), { title, category, notes, metadata, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'documents'), { userId: user.uid, title, category, notes, metadata, fileUrl: '', createdAt: serverTimestamp() });
      }
      navigate('/documents');
    } catch (err) {
      alert('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Others'];

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 pb-32 animate-in fade-in duration-300">
      <div className="flex items-center space-x-6 mb-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 hover:text-primary transition-all">
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Documents</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Secure Your documents</p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12 items-start">
        <div className="mb-10 lg:sticky lg:top-24 max-w-lg mx-auto w-full">
           <div className={`w-full aspect-[1.6/1] rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300 ${config.color}`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <div className="h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                   <div className="flex items-center space-x-4">
                     <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl shadow-sm">
                        <i className={`fas ${config.icon}`}></i>
                     </div>
                     <div>
                        <h3 className="text-lg font-black uppercase tracking-tight leading-tight truncate max-w-[180px] drop-shadow-sm">{title || 'NEW ARTIFACT'}</h3>
                        <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em]">{category}</p>
                     </div>
                  </div>
                   <i className="fas fa-shield-halved opacity-40 text-xl"></i>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {dynamicFields.slice(0, 4).map((f, i) => (
                    <div key={i}>
                      <p className="text-[7px] font-black uppercase opacity-50 tracking-widest leading-none mb-1 truncate">{f.key}</p>
                      <p className="text-[10px] font-bold truncate drop-shadow-sm">{f.value || '••••••••'}</p>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="mt-8 grid grid-cols-3 gap-2">
              {Object.keys(CATEGORY_CONFIG).map(cat => (
                <button 
                  key={cat} 
                  type="button"
                  onClick={() => handleCategoryChange(cat)} 
                  className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-xl border transition-all ${category === cat ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white dark:bg-secondary border-gray-100 dark:border-gray-800 text-gray-400 hover:border-primary/30'}`}
                >
                  <i className={`fas ${CATEGORY_CONFIG[cat].icon} text-xs`}></i>
                  <span className="text-[7px] font-black uppercase tracking-tighter text-center">{cat}</span>
                </button>
              ))}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto lg:max-w-full w-full">
          <div className="bg-white dark:bg-secondary p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-800 pb-5">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Content Manifest</h3>
                <p className="text-[8px] font-bold text-primary uppercase mt-1">Data Indexing Active</p>
              </div>
              <button 
                type="button" 
                onClick={addCustomField}
                className="text-[8px] font-black uppercase text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <i className="fas fa-plus mr-1.5"></i> Custom Field
              </button>
            </div>

            <div className="space-y-8">
              <div className="border-l-4 border-primary/40 pl-5 group transition-all">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 group-focus-within:text-primary transition-colors tracking-widest">Identification Title</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors" 
                  placeholder="e.g. My National ID Card"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                 {dynamicFields.map((field, idx) => (
                   <div key={idx} className="relative border-l-4 border-primary/20 pl-5 group transition-all bg-gray-50/30 dark:bg-dark/20 p-4 rounded-xl border border-transparent hover:border-primary/10">
                      <div className="flex items-center justify-between mb-2">
                        <input 
                          type="text"
                          className="bg-transparent text-[9px] font-black text-gray-400 uppercase outline-none focus:text-primary transition-colors tracking-widest w-full mr-2"
                          value={field.key}
                          onChange={e => updateField(idx, { key: e.target.value })}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeField(idx)}
                          className="text-[10px] text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <i className="fas fa-times-circle"></i>
                        </button>
                      </div>
                      <input 
                        type={field.key.toLowerCase().includes('password') ? 'password' : 'text'} 
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-sm py-2 focus:border-primary transition-colors" 
                        value={field.value} 
                        onChange={e => updateField(idx, { value: e.target.value })} 
                      />
                   </div>
                 ))}
              </div>

              <div className="border-l-4 border-primary/10 pl-5">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Additional Remarks (Encrypted)</label>
                <textarea 
                  className="w-full bg-gray-50 dark:bg-dark border border-gray-100 dark:border-gray-800 rounded-xl outline-none font-medium text-xs p-4 min-h-[120px] resize-none focus:ring-4 focus:ring-primary/5 transition-all" 
                  placeholder="Private notes related to this document..."
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]">
            {loading ? 'ENCRYPTING DATA...' : (isEdit ? 'UPDATE VAULT' : 'PUBLISH TO VAULT')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDocument;
