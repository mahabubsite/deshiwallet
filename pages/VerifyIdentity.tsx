
import React, { useState } from 'react';
import * as Router from 'react-router-dom';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { VerificationStatus } from '../types';

const { useNavigate } = Router as any;

const VerifyIdentity: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [docType, setDocType] = useState('NID');
  const [docContent, setDocContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError('User session not found. Please log in again.');
      return;
    }
    
    if (!docContent.trim()) {
      setSubmitError(`Please enter your ${docType} details.`);
      return;
    }

    setLoading(true);
    setSubmitError('');
    
    try {
      await addDoc(collection(db, 'verificationRequests'), {
        userId: user.uid,
        userName: profile?.fullName || 'User',
        userEmail: user.email || profile?.email || '',
        docType: docType,
        docContent: docContent.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // NOTIFY ADMIN
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin_alert',
        title: 'New Verification Request 🆔',
        message: `${profile?.fullName} has submitted a ${docType} for manual identity review.`,
        read: false,
        createdAt: serverTimestamp()
      });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        status: VerificationStatus.PENDING,
        uid: user.uid,
        email: user.email || profile?.email || ''
      }, { merge: true });

      await refreshProfile();
      setStep(3);
    } catch (err: any) {
      console.error("Verification Submission Error:", err);
      setSubmitError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    switch (docType) {
      case 'NID': return 'National ID Number';
      case 'Passport': return 'Passport Number';
      case 'Driving License': return 'License Number';
      case 'Birth Certificate': return 'Registration Number';
      default: return 'Document Details';
    }
  };

  const getPlaceholder = () => {
    switch (docType) {
      case 'NID': return 'e.g. 1234567890';
      case 'Passport': return 'e.g. A12345678';
      case 'Driving License': return 'e.g. DL-123456';
      case 'Birth Certificate': return 'e.g. 20231234567890123';
      default: return 'Enter number here...';
    }
  };

  const getInputType = () => {
    if (docType === 'NID' || docType === 'Birth Certificate') return 'tel';
    return 'text';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 min-h-[80vh] flex flex-col justify-center">
      {step === 1 && (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
            <i className="fas fa-shield-check text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Verify Identity</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Choose a valid document to start your digital verification process.
          </p>
          
          <div className="bg-white dark:bg-secondary p-8 rounded-[40px] text-left shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Available Methods</h3>
            <div className="grid gap-4">
              {['NID', 'Birth Certificate', 'Passport', 'Driving License'].map(type => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
                    docType === type 
                      ? 'border-primary bg-primary/5 shadow-inner' 
                      : 'border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-dark/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${docType === type ? 'bg-primary text-white' : 'bg-white dark:bg-secondary text-gray-400'}`}>
                      <i className={`fas ${type === 'Passport' ? 'fa-passport' : 'fa-id-card'}`}></i>
                    </div>
                    <span className={`font-bold text-sm ${docType === type ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{type}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${docType === type ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                    {docType === type && <i className="fas fa-check text-[10px] text-white"></i>}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => setStep(2)}
            className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/25 hover:bg-blue-600 transition-all transform active:scale-[0.98]"
          >
            Continue Verification
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => { setStep(1); setSubmitError(''); }} 
              className="w-10 h-10 bg-white dark:bg-secondary rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="text-right">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{docType}</h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Step 2 of 2</p>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{getLabel()}</label>
              <div className="relative">
                <input
                  type={getInputType()}
                  className={`w-full p-5 bg-gray-50 dark:bg-dark border-2 rounded-2xl outline-none transition-all text-lg font-bold tracking-wider ${
                    submitError ? 'border-red-100 ring-2 ring-red-50' : 'border-gray-50 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/5'
                  }`}
                  placeholder={getPlaceholder()}
                  value={docContent}
                  onChange={(e) => {
                    setDocContent(e.target.value);
                    if (submitError) setSubmitError('');
                  }}
                />
              </div>
              {submitError && (
                <p className="mt-3 text-xs font-bold text-red-500 flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i> {submitError}
                </p>
              )}
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-amber-500 mt-1"></i>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                  Make sure you enter the correct <strong>{getLabel()}</strong> as it appears on your physical document. Incorrect details will lead to immediate rejection.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
             <button 
                onClick={() => { setStep(1); setSubmitError(''); }} 
                className="flex-1 py-5 bg-white dark:bg-secondary text-gray-500 font-black rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 transition-all"
             >
               Cancel
             </button>
             <button 
                onClick={handleSubmit} 
                disabled={loading || !docContent.trim()} 
                className="flex-[2] py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/25 hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center space-x-3"
             >
               {loading ? (
                 <>
                   <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span>Processing...</span>
                 </>
               ) : (
                 <>
                   <span>Submit Details</span>
                   <i className="fas fa-paper-plane text-xs"></i>
                 </>
               )}
             </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-12 space-y-8 animate-in zoom-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10 relative z-10">
              <i className="fas fa-hourglass-half text-4xl animate-pulse"></i>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/5 rounded-full animate-ping"></div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Under Review</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              We've received your <strong>{docType}</strong> details. Our agents are currently reviewing your request.
            </p>
          </div>

          <button 
            onClick={() => navigate('/')} 
            className="w-full max-w-sm py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyIdentity;
