
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import * as Router from 'react-router-dom';
import * as firebaseAuth from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, Notification } from './types';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import VerifyIdentity from './pages/VerifyIdentity';
import DocumentVault from './pages/DocumentVault';
import AddDocument from './pages/AddDocument';
import DocumentDetails from './pages/DocumentDetails';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import AddCard from './pages/AddCard';
import CardDetails from './pages/CardDetails';
import Settings from './pages/Settings';
import About from './pages/About';

// Settings Sub-pages
import PrivacyCenter from './pages/Settings/PrivacyCenter';
import HelpSupport from './pages/Settings/HelpSupport';
import TermsConditions from './pages/Settings/TermsConditions';
import ChangePin from './pages/Settings/ChangePin';
import ChangePassword from './pages/Settings/ChangePassword';
import LanguageSelection from './pages/Settings/Language';
import ReportIssue from './pages/Settings/ReportIssue';
import EditProfile from './pages/Settings/EditProfile';
import DynamicPage from './pages/Settings/DynamicPage';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminVerification from './pages/Admin/Verification';
import AdminDocuments from './pages/Admin/Documents';
import AdminCards from './pages/Admin/Cards';
import AdminDeletionRequests from './pages/Admin/DeletionRequests';
import AdminDesigns from './pages/Admin/Designs';
import AdminSettings from './pages/Admin/Settings';
import AdminReports from './pages/Admin/Reports';
import AdminNotifications from './pages/Admin/Notifications';

// Components
import Navbar from './components/Navbar';
import AdminSidebar from './components/Admin/AdminSidebar';
import LoadingScreen from './components/LoadingScreen';
import PinLock from './components/PinLock';

const { HashRouter, Routes, Route, Navigate, useLocation, useNavigate: useNav } = Router as any;
const { onAuthStateChanged } = firebaseAuth as any;

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isUnlocked: boolean;
  setUnlocked: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setUnlocked] = useState(false);

  const fetchProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        if (!data.pinProtectionEnabled) {
          setUnlocked(true);
        }
      } else {
        setProfile(null);
        setUnlocked(true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUnlocked(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u: any) => {
      setUser(u);
      if (u) {
        await fetchProfile(u.uid);
      } else {
        setProfile(null);
        setUnlocked(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isUnlocked, setUnlocked, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading, isUnlocked } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} />;
  
  if (!isUnlocked && profile?.pinProtectionEnabled) {
    return <PinLock />;
  }

  if (adminOnly && profile?.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminAlerts, setAdminAlerts] = useState<Notification[]>([]);
  const { profile } = useAuth();
  const nav = useNav();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('userId', '==', 'admin_alert'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAdminAlerts(docs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasUnread = adminAlerts.some(n => !n.read);

  const markAllRead = async () => {
    const batch = writeBatch(db);
    adminAlerts.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  return (
    <div className="flex min-h-screen bg-[#F3F7FF] dark:bg-dark text-gray-900 dark:text-gray-100">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white dark:bg-secondary flex items-center justify-between px-4 md:px-8 border-b border-gray-100 dark:border-gray-800 relative z-[60]">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-500"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Portal</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-10 h-10 bg-gray-50 dark:bg-dark rounded-xl flex items-center justify-center text-gray-400 relative hover:text-primary transition-colors"
              >
                <i className="fas fa-bell"></i>
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-secondary"></span>
                )}
              </button>
              
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-2xl animate-in fade-in slide-in-from-top-2 overflow-hidden">
                  <div className="p-5 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Alerts</span>
                    {hasUnread && (
                      <button onClick={markAllRead} className="text-[8px] font-black text-primary uppercase">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto no-scrollbar">
                    {adminAlerts.length === 0 ? (
                      <div className="p-10 text-center">
                        <i className="fas fa-check-circle text-gray-100 text-3xl mb-2"></i>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No alerts</p>
                      </div>
                    ) : (
                      adminAlerts.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-gray-50 dark:border-gray-800 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-dark/20 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                          onClick={async () => {
                            if (!n.read) await updateDoc(doc(db, 'notifications', n.id), { read: true });
                            if (n.title.includes('Verification')) nav('/admin/verification');
                            else if (n.title.includes('Deletion')) nav('/admin/deletion');
                            else if (n.title.includes('User')) nav('/admin/users');
                            else if (n.title.includes('Feedback') || n.title.includes('Report')) nav('/admin/reports');
                            setNotifOpen(false);
                          }}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <i className="fas fa-bolt text-xs"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{n.title}</p>
                            <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                          </div>
                          {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-gray-800 dark:text-white">{profile?.fullName}</p>
                <p className="text-[8px] text-primary font-black uppercase tracking-tighter">System Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden">
                 <img src={`https://i.pravatar.cc/150?u=${profile?.uid}`} alt="admin" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const showStandardNavbar = !['/login', '/signup'].includes(location.pathname) && !isAdminPath;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark transition-colors duration-300">
      {showStandardNavbar && <Navbar />}
      <main className={`flex-grow ${showStandardNavbar ? 'pb-20 md:pb-0' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentVault /></ProtectedRoute>} />
          <Route path="/document/:id" element={<ProtectedRoute><DocumentDetails /></ProtectedRoute>} />
          <Route path="/add-document" element={<ProtectedRoute><AddDocument /></ProtectedRoute>} />
          <Route path="/edit-document/:id" element={<ProtectedRoute><AddDocument isEdit /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/notification/:id" element={<ProtectedRoute><NotificationDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/settings/privacy" element={<ProtectedRoute><PrivacyCenter /></ProtectedRoute>} />
          <Route path="/settings/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
          <Route path="/settings/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
          <Route path="/settings/terms" element={<ProtectedRoute><TermsConditions /></ProtectedRoute>} />
          <Route path="/settings/pin" element={<ProtectedRoute><ChangePin /></ProtectedRoute>} />
          <Route path="/settings/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/settings/language" element={<ProtectedRoute><LanguageSelection /></ProtectedRoute>} />
          <Route path="/settings/page/:pageId" element={<ProtectedRoute><DynamicPage /></ProtectedRoute>} />
          <Route path="/add-card" element={<ProtectedRoute><AddCard /></ProtectedRoute>} />
          <Route path="/card/:id" element={<ProtectedRoute><CardDetails /></ProtectedRoute>} />
          <Route path="/edit-card/:id" element={<ProtectedRoute><AddCard isEdit /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          
          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/users" element={<AdminUsers />} />
                  <Route path="/verification" element={<AdminVerification />} />
                  <Route path="/documents" element={<AdminDocuments />} />
                  <Route path="/cards" element={<AdminCards />} />
                  <Route path="/deletion" element={<AdminDeletionRequests />} />
                  <Route path="/designs" element={<AdminDesigns />} />
                  <Route path="/settings" element={<AdminSettings />} />
                  <Route path="/reports" element={<AdminReports />} />
                  <Route path="/notifications" element={<AdminNotifications />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
