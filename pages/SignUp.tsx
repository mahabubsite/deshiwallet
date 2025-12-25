
import React, { useState, useEffect, useRef } from 'react';
import * as Router from 'react-router-dom';
import * as firebaseAuth from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserRole, VerificationStatus } from '../types';

const { Link, useNavigate } = Router as any;
const { createUserWithEmailAndPassword } = firebaseAuth as any;

const ADMIN_EMAIL = 'mdmahbubsite@gmail.com';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DatePickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
}> = ({ isOpen, onClose, onSelect, initialDate }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [selYear, setSelYear] = useState(years[25]); // Default ~1998
  const [selMonth, setSelMonth] = useState(5); // June
  const [selDay, setSelDay] = useState(24);

  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, val: number, list: any[]) => {
          if (ref && ref.current) {
            const idx = list.indexOf(val);
            const itemHeight = 40; 
            ref.current.scrollTop = idx * itemHeight;
          }
        };
        scrollTo(yearRef, selYear, years);
        scrollTo(monthRef, selMonth, [0,1,2,3,4,5,6,7,8,9,10,11]);
        scrollTo(dayRef, selDay, days);
      }, 50);
    }
  }, [isOpen]);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, setter: (v: any) => void, list: any[]) => {
    if (ref && ref.current) {
      const itemHeight = 40;
      const index = Math.round(ref.current.scrollTop / itemHeight);
      if (list[index] !== undefined) setter(list[index]);
    }
  };

  const handleSubmit = () => {
    const formattedMonth = String(selMonth + 1).padStart(2, '0');
    const formattedDay = String(selDay).padStart(2, '0');
    onSelect(`${selYear}-${formattedMonth}-${formattedDay}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#121212] w-full max-w-[360px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 dark:border-white/5">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Set Birthday</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        <div className="relative h-[200px] flex px-8 py-4">
          <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-gray-50 dark:bg-white/5 pointer-events-none z-0"></div>
          
          <style>{`
            .picker-col::-webkit-scrollbar { display: none; }
            .picker-col { -ms-overflow-style: none; scrollbar-width: none; }
            .picker-item { height: 40px; display: flex; align-items: center; justify-content: center; }
          `}</style>

          <div ref={yearRef} onScroll={() => handleScroll(yearRef, setSelYear, years)} className="picker-col flex-1 overflow-y-scroll snap-y snap-mandatory relative z-10">
            <div className="h-20"></div>
            {years.map(y => (
              <div key={y} className={`picker-item snap-center text-sm font-bold transition-all ${selYear === y ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>{y}</div>
            ))}
            <div className="h-20"></div>
          </div>

          <div ref={monthRef} onScroll={() => handleScroll(monthRef, setSelMonth, [0,1,2,3,4,5,6,7,8,9,10,11])} className="picker-col flex-1 overflow-y-scroll snap-y snap-mandatory relative z-10">
            <div className="h-20"></div>
            {MONTHS.map((m, i) => (
              <div key={m} className={`picker-item snap-center text-sm font-bold transition-all ${selMonth === i ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>{m}</div>
            ))}
            <div className="h-20"></div>
          </div>

          <div ref={dayRef} onScroll={() => handleScroll(dayRef, setSelDay, days)} className="picker-col flex-1 overflow-y-scroll snap-y snap-mandatory relative z-10">
            <div className="h-20"></div>
            {days.map(d => (
              <div key={d} className={`picker-item snap-center text-sm font-bold transition-all ${selDay === d ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>{d}</div>
            ))}
            <div className="h-20"></div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4">
          <button onClick={handleSubmit} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl active:scale-[0.98] transition-all">Submit</button>
        </div>
      </div>
    </div>
  );
};

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dob) {
      setError('Please select your date of birth');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const role = formData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? UserRole.ADMIN : UserRole.USER;
      const status = role === UserRole.ADMIN ? VerificationStatus.VERIFIED : VerificationStatus.PENDING;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        dob: formData.dob,
        status: status,
        role: role,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Welcome to Deshi Wallet! 🚀',
        message: `Hello ${formData.fullName.split(' ')[0]}! Your premium digital vault is now ready. Start securing your identity by adding your cards and documents.`,
        read: false,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: 'admin_alert',
        title: 'New User Registered 👤',
        message: `A new user named ${formData.fullName} (${formData.email}) has just joined the platform.`,
        read: false,
        createdAt: serverTimestamp()
      });

      await auth.signOut();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-dark">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-6">
            <i className="fas fa-user-plus text-3xl"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Join our secure vault ecosystem</p>
        </div>

        <div className="bg-white dark:bg-secondary p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-sm"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full px-5 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl text-left font-bold text-sm transition-all focus:ring-2 focus:ring-primary flex items-center justify-between"
              >
                <div className="flex items-center">
                  <i className="fas fa-calendar text-gray-400 mr-3"></i>
                  {formData.dob ? (
                    <span className="text-gray-900 dark:text-white">{new Date(formData.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  ) : (
                    <span className="text-gray-400">Select Birthday</span>
                  )}
                </div>
                <i className="fas fa-chevron-down text-[10px] text-gray-300"></i>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-sm"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-shield-check"></i>
                </span>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                />
              </div>
              <label htmlFor="terms" className="ml-3 text-xs font-medium text-gray-500">
                I accept the <button type="button" className="text-primary font-bold hover:underline">Terms & Conditions</button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Identity</span>
                  <i className="fas fa-arrow-right ml-2"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Existing identity?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>

      <DatePickerModal 
        isOpen={isDatePickerOpen} 
        onClose={() => setIsDatePickerOpen(false)} 
        onSelect={(date) => setFormData({ ...formData, dob: date })}
      />
    </div>
  );
};

export default SignUp;
