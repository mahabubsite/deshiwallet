
import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import { useAuth } from '../App';
import { VerificationStatus } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import * as firebaseAuth from 'firebase/auth';

const { useNavigate } = Router as any;
const { updateEmail } = firebaseAuth as any;

const Profile: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: ''
  });
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
        try {
          await updateEmail(user, formData.email);
        } catch (authErr: any) {
          if (authErr.code === 'auth/requires-recent-login') {
            throw new Error('Please log out and log in again before changing your email.');
          }
          throw authErr;
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        dob: formData.dob
      });

      await refreshProfile();
      setIsEditing(false);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 pb-20">
      <div className="lg:grid lg:grid-cols-[1fr_2fr] lg:gap-12 items-start">
        {/* Left Column: Avatar & Quick Stats */}
        <div className="text-center lg:text-left mb-10 lg:mb-0 lg:sticky lg:top-24">
          <div className="relative inline-block lg:block">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-primary rounded-[32px] flex items-center justify-center text-white text-3xl lg:text-5xl font-black shadow-2xl shadow-primary/30 mx-auto lg:mx-0 overflow-hidden">
              {profile?.fullName?.charAt(0) || '?'}
            </div>
            {profile?.status === VerificationStatus.VERIFIED && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-dark rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                <i className="fas fa-check"></i>
              </div>
            )}
          </div>
          <div className="mt-6">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">{profile?.fullName || 'User Profile'}</h1>
            <p className="text-gray-500 font-medium">{profile?.email}</p>
          </div>
          <div className="mt-8 flex flex-col space-y-3 lg:max-w-[240px]">
            <button onClick={() => setIsEditing(!isEditing)} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 text-[10px] uppercase tracking-widest">{isEditing ? 'Cancel Editing' : 'Edit Profile'}</button>
            <button onClick={() => navigate('/settings')} className="w-full py-4 bg-gray-50 dark:bg-dark text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Settings</button>
          </div>
        </div>

        {/* Right Column: Information & Edit Form */}
        <div className="space-y-6">
          {message.text && (
            <div className={`p-4 rounded-2xl text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {message.text}
            </div>
          )}

          {!isEditing ? (
            <div className="bg-white dark:bg-secondary p-10 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-800 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black uppercase text-gray-400 tracking-widest">Vault Identity Details</h3>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase ${profile?.status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {profile?.status || 'PENDING'}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Legal Full Name</span>
                  <p className="text-lg font-black">{profile?.fullName || 'Not Set'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Primary Email</span>
                  <p className="text-lg font-black">{profile?.email || 'Not Set'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Date of Birth</span>
                  <p className="text-lg font-black">{profile?.dob || 'Not Set'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Member Since</span>
                  <p className="text-lg font-black">{profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="bg-white dark:bg-secondary p-10 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-800 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-[12px] font-black uppercase text-primary tracking-widest mb-6">Modify Account Data</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                  <input type="text" required className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email</label>
                  <input type="email" required className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Birth Date</label>
                  <input type="date" required className="w-full px-5 py-4 bg-gray-50 dark:bg-dark rounded-2xl border-none outline-none font-bold text-sm" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/25 text-[10px] uppercase tracking-widest">
                {loading ? 'Updating Profile...' : 'Save All Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
