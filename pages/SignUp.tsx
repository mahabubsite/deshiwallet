
import React, { useState } from 'react';
import * as Router from 'react-router-dom';
import * as firebaseAuth from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserRole, VerificationStatus } from '../types';

const { Link, useNavigate } = Router as any;
const { createUserWithEmailAndPassword } = firebaseAuth as any;

const ADMIN_EMAIL = 'mdmahbubsite@gmail.com';

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
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // 1. WELCOME NOTIFICATION FOR THE NEW USER
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Welcome to Deshi Wallet! 🚀',
        message: `Hello ${formData.fullName.split(' ')[0]}! Your premium digital vault is now ready. Start securing your identity by adding your cards and documents.`,
        read: false,
        createdAt: serverTimestamp()
      });

      // 2. NOTIFY ADMIN OF NEW REGISTRATION
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
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Join the elite digital wallet ecosystem</p>
        </div>

        <div className="bg-white dark:bg-secondary p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
          <form className="space-y-5" onSubmit={handleSignUp}>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                required
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input
                type="email"
                required
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
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
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I accept the{' '}
                <button type="button" className="text-primary font-bold">Terms & Conditions</button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
