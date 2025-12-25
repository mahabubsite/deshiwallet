
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { useAuth } from '../../App';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import * as firebaseAuth from 'firebase/auth';

const { useNavigate } = Router as any;
const { updateEmail } = firebaseAuth as any;

const EditProfile: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', dob: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        dob: profile.dob || ''
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      if (formData.email !== profile?.email) {
        await updateEmail(user, formData.email);
      }
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        dob: formData.dob
      });
      await refreshProfile();
      setMessage({ text: 'Information updated successfully.', type: 'success' });
      setTimeout(() => navigate('/settings'), 1000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Operation failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto p-4 md:py-16">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 hover:text-primary transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Identity Registry</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Manage Core Profile Data</p>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <form onSubmit={handleUpdate} className="space-y-10">
          {message.text && (
            <div className={`p-4 font-black text-[10px] uppercase tracking-widest border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Legal Name of Subject</label>
              <input type="text" required className="w-full py-2 bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-colors" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Electronic Mail Address</label>
              <input type="email" required className="w-full py-2 bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-colors" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Date of Record Birth</label>
              <input type="date" required className="w-full py-2 bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-colors" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">
            {loading ? 'Processing Sync...' : 'Publish Profile Updates'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-center">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">DATA ENCRYPTED BY AES-256 PROTOCOL</p>
      </div>
    </div>
  );
};

export default EditProfile;
