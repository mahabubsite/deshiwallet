
import React, { useState } from 'react';
import * as Router from 'react-router-dom';
import * as firebaseAuth from 'firebase/auth';
import { auth } from '../../firebase';

const { useNavigate } = Router as any;
const { updatePassword, EmailAuthProvider, reauthenticateWithCredential } = firebaseAuth as any;

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords mismatch.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password requires min 6 chars.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Null User");
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/settings'), 1000);
    } catch (err: any) {
      setError(err.code === 'auth/wrong-password' ? 'Invalid current password.' : 'Sync failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto p-4 md:py-20">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tight">Access Credentials</h1>
      </div>

      <div className="bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 pb-4 border-b border-gray-50 dark:border-gray-800">Update Secure Credentials</h3>
        
        <form onSubmit={handleUpdate} className="space-y-10">
          {error && <div className="p-4 font-black text-[10px] uppercase text-red-600 border border-red-100 bg-red-50">{error}</div>}
          {success && <div className="p-4 font-black text-[10px] uppercase text-emerald-600 border border-emerald-100 bg-emerald-50">Sync Successful.</div>}
          
          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Authorization Code</label>
              <input 
                type="password"
                required
                className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-colors"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">New Authorization Code</label>
              <input 
                type="password"
                required
                className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-colors"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div className="border-l-4 border-primary pl-6">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Confirm New Code</label>
              <input 
                type="password"
                required
                className="w-full bg-transparent border-b-2 border-gray-100 dark:border-gray-800 outline-none font-bold text-lg focus:border-primary transition-colors"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || success}
            className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-lg shadow-primary/10"
          >
            {loading ? 'VALIDATING SESSION...' : 'COMMIT UPDATES'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
