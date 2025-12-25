
import React, { useState } from 'react';
import * as Router from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../App';

const { useNavigate } = Router as any;

const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('Feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userName: profile?.fullName || 'Identity Holder',
        userEmail: user.email || 'N/A',
        text: feedbackText,
        type: feedbackType,
        status: 'unread',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: 'admin_alert',
        title: `Report: ${feedbackType} ID-${Math.floor(Math.random()*1000)}`,
        message: `System communication from ${profile?.fullName}.`,
        read: false,
        createdAt: serverTimestamp()
      });

      setShowSuccess(true);
      setFeedbackText('');
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/settings');
      }, 1500);
    } catch (err) {
      alert('Communication transmission failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:py-16">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Platform Reporting</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Secure Feedback Channel</p>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
        <div className="w-full md:w-80 p-8 bg-gray-50 dark:bg-dark/20">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">Classification</h3>
           <div className="flex flex-col gap-3">
            {['Feedback', 'Bug Report', 'General Query'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFeedbackType(type)}
                className={`p-4 text-[10px] font-black uppercase tracking-widest border-l-4 transition-all text-left ${feedbackType === type ? 'bg-primary/5 border-primary text-primary' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="flex-1 p-8 md:p-12 space-y-10">
          <div>
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Detailed Narrative</label>
             <textarea
                className="w-full p-6 bg-gray-50 dark:bg-dark border-2 border-gray-100 dark:border-gray-800 outline-none focus:border-primary text-sm font-bold min-h-[250px] resize-none leading-relaxed"
                placeholder="Initialize communication with descriptive context..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
             ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !feedbackText.trim()}
            className="w-full py-5 bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-600 transition-all flex items-center justify-center space-x-4"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin"></div>
            ) : (
              <>
                <span>Transmit To Engineering</span>
                <i className="fas fa-paper-plane text-[10px]"></i>
              </>
            )}
          </button>

          {showSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-center font-black text-[10px] uppercase tracking-widest border border-emerald-100">
              Communication Secured & Transmitted.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
