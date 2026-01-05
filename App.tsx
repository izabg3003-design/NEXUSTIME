
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SplashScreen from './components/SplashScreen';
import LanguageGate from './components/LanguageGate';
import LandingPage from './components/LandingPage';
import SubscriptionPage from './components/SubscriptionPage';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FinancePage from './components/FinancePage';
import ReportsPage from './components/ReportsPage';
import AccountantPage from './components/AccountantPage';
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import VendorDetailPage from './components/VendorDetailPage';
import VendorSalesPage from './components/VendorSalesPage';
import SupportPage from './components/SupportPage';
import UserSupportPage from './components/UserSupportPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import { AppState, UserProfile, WorkRecord, Language, Currency } from './types';
import { supabase, isConfigured } from './lib/supabase';
import { translations } from './translations';
import { differenceInDays, addYears, parseISO } from 'date-fns';

const DEFAULT_USER: UserProfile = {
  name: 'Membro Nexus',
  email: '',
  photo: null,
  hourlyRate: 10,
  defaultEntry: '09:00',
  defaultExit: '18:00',
  socialSecurity: { value: 11, type: 'percentage' },
  irs: { value: 15, type: 'percentage' },
  isFreelancer: false,
  vat: { value: 23, type: 'percentage' },
  role: 'user',
  overtimeRates: { h1: 50, h2: 75, h3: 100 },
  settings: { language: 'pt-PT', currency: 'EUR' }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [systemLang, setSystemLang] = useState<Language>(() => (localStorage.getItem('nexus_lang') as Language) || 'pt-PT');
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [records, setRecords] = useState<Record<string, WorkRecord>>({});
  const [selectedVendorData, setSelectedVendorData] = useState<any>(null);
  const [authError, setAuthError] = useState<{ title: string, text: string } | null>(null);
  
  const isInitialLoad = useRef(true);
  const notificationChecked = useRef(false);

  const t = useCallback((key: string): any => {
    const activeLang = user.settings?.language || systemLang;
    const parts = key.split('.');
    let current = translations[activeLang] || translations['pt-PT'];
    for (const part of parts) { if (!current) return key; current = current[part]; }
    return current || key;
  }, [user.settings?.language, systemLang]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat(systemLang, { 
      style: 'currency', 
      currency: user.settings?.currency || 'EUR' 
    }).format(value);
  }, [systemLang, user.settings?.currency]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(DEFAULT_USER);
    setSelectedVendorData(null);
    setAppState('landing');
    setAuthError(null);
    notificationChecked.current = false;
  };

  const checkSubscriptionAlert = async (profile: UserProfile) => {
    if (notificationChecked.current || !profile.id || profile.role !== 'user') return;
    
    try {
      const sub = typeof profile.subscription === 'string' ? JSON.parse(profile.subscription) : profile.subscription;
      if (!sub?.startDate) return;

      const expiry = addYears(parseISO(sub.startDate), 1);
      const daysLeft = differenceInDays(expiry, new Date());

      if (daysLeft <= 30 && daysLeft > 0) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .ilike('text', '%assinatura expira em%');

        if (count === 0) {
          await supabase.from('chat_messages').insert({
            user_id: profile.id,
            sender_role: 'support',
            text: `⚠️ NOTIFICAÇÃO DIGITAL NEXUS: A sua assinatura expira em ${daysLeft} dias. Por favor, contacte o suporte para renovação.`
          });
        }
      }
      notificationChecked.current = true;
    } catch (e) {
      console.error("Nexus Sub Check Error:", e);
    }
  };

  const loadUserData = useCallback(async (userId: string, retryCount = 0) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (!profile && retryCount < 3) {
        setTimeout(() => loadUserData(userId, retryCount + 1), 1000);
        return;
      }

      if (profile) {
        const sub = profile.subscription;
        const parsedSub = typeof sub === 'string' ? JSON.parse(sub) : (sub || {});
        const isSuspended = parsedSub.isActive === false;
        const isMaster = profile.email === 'master@digitalnexus.com';
        const isVendor = profile.role === 'vendor';
        const isSupport = profile.role === 'support';

        if (isSuspended && !isMaster) {
          await supabase.auth.signOut();
          setAuthError({ 
            title: 'ACESSO BLOQUEADO', 
            text: 'A sua conta Digital Nexus foi suspensa por falta de pagamento ou violação de termos. Contacte o suporte.' 
          });
          setAppState('login');
          setAuthInitialized(true);
          return;
        }

        setUser(profile);
        setAuthError(null);
        checkSubscriptionAlert(profile);
        
        if (isMaster) {
          setAppState('admin');
        } else if (isVendor) {
          setSelectedVendorData({ id: profile.id, name: profile.name, code: profile.vendor_code });
          setAppState('vendor-detail');
        } else if (isSupport) {
          setAppState('support');
        } else {
          setAppState('dashboard');
        }

        const { data: dbRecords } = await supabase.from('work_records').select('*').eq('user_id', userId);
        if (dbRecords) {
          const formatted: Record<string, WorkRecord> = {};
          dbRecords.forEach((r: any) => {
            if (r.data) formatted[r.date] = r.data;
          });
          setRecords(formatted);
        }
      } else {
        setAppState('landing');
      }
    } catch (e) {
      console.error("Nexus Init Error:", e);
      setAppState('landing');
    } finally {
      setTimeout(() => setAuthInitialized(true), 100);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setAppState('language-gate');
      return;
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadUserData(session.user.id);
      } else {
        const storedLang = localStorage.getItem('nexus_lang');
        setAppState(storedLang ? 'landing' : 'language-gate');
        setAuthInitialized(true);
      }
    };

    if (isInitialLoad.current) {
      initAuth();
      isInitialLoad.current = false;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthInitialized(false);
        loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAppState('landing');
        setUser(DEFAULT_USER);
        setSelectedVendorData(null);
        setAuthInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  useEffect(() => {
    if (appState === 'splash' && authInitialized) {
      const storedLang = localStorage.getItem('nexus_lang');
      setAppState(storedLang ? 'landing' : 'language-gate');
    }
  }, [appState, authInitialized]);

  const handleUpdateProfile = async (updatedUser: UserProfile) => {
    try {
      if (!user.id) return false;
      const { id, email, created_at, ...updateData } = updatedUser;
      const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
      if (error) throw error;
      setUser(updatedUser);
      return true;
    } catch (e) { return false; }
  };

  const handleAddRecord = async (r: WorkRecord) => {
    try {
      if (!user.id) return false;
      const { error } = await supabase.from('work_records').upsert(
        { user_id: user.id, date: r.date, data: r }, 
        { onConflict: 'user_id,date' }
      );
      if (error) throw error;
      setRecords((prev: any) => ({ ...prev, [r.date]: r }));
      return true;
    } catch (e) { return false; }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#020617] selection:bg-purple-500/30">
      {(appState === 'splash') ? <SplashScreen t={t} /> : null}
      
      {appState === 'language-gate' && <LanguageGate onSelect={(l) => { setSystemLang(l); localStorage.setItem('nexus_lang', l); setAppState('landing'); }} />}
      {appState === 'landing' && <LandingPage onLogin={() => setAppState('login')} onSubscribe={() => setAppState('subscription')} t={t} lang={systemLang} setLang={setSystemLang} onPrivacy={() => setAppState('privacy')} onTerms={() => setAppState('terms')} />}
      {appState === 'privacy' && <PrivacyPage onBack={() => setAppState('landing')} />}
      {appState === 'terms' && <TermsPage onBack={() => setAppState('landing')} />}
      {appState === 'subscription' && <SubscriptionPage onSuccess={() => setAppState('login')} onBack={() => setAppState('landing')} t={t} />}
      {appState === 'login' && <LoginPage onLogin={() => {}} onBack={() => setAppState('landing')} t={t} externalError={authError} />}
      
      {['dashboard', 'finance', 'reports', 'accountant', 'settings', 'admin', 'vendor-detail', 'vendor-sales', 'support', 'user-support'].includes(appState) && (
        <div className="flex h-screen overflow-hidden relative">
          <Sidebar activeTab={appState} setActiveTab={setAppState} user={user} onLogout={handleLogout} t={t} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-12 pt-6 md:pt-12 pb-40 md:pb-12 ml-0 md:ml-24 scroll-smooth">
            <div className="max-w-5xl mx-auto w-full">
              {appState === 'dashboard' && <Dashboard user={user} records={records} onAddRecord={handleAddRecord} t={t} />}
              {appState === 'finance' && <FinancePage user={user} records={records} t={t} f={formatCurrency} />}
              {appState === 'reports' && <ReportsPage user={user} records={records} t={t} f={formatCurrency} />}
              {appState === 'accountant' && <AccountantPage user={user} records={records} t={t} f={formatCurrency} />}
              {appState === 'settings' && <SettingsPage user={user} setUser={handleUpdateProfile} t={t} />}
              {appState === 'admin' && (
                <AdminPage 
                  currentUser={user} 
                  f={formatCurrency}
                  onLogout={handleLogout}
                  t={t}
                  onUpdateProfile={handleUpdateProfile}
                  onViewVendor={(id) => { setSelectedVendorData({id}); setAppState('vendor-detail'); }}
                  onViewVendorSales={(vendor) => { setSelectedVendorData(vendor); setAppState('vendor-sales'); }}
                />
              )}
              {appState === 'vendor-detail' && (
                <VendorDetailPage 
                  vendorId={selectedVendorData?.id || user.id || ""} 
                  currentUser={user}
                  onBack={() => setAppState(user.role === 'vendor' ? 'vendor-detail' : 'admin')} 
                  f={formatCurrency} 
                  isVendorSelf={selectedVendorData?.id === user.id || user.role === 'vendor'} 
                />
              )}
              {appState === 'vendor-sales' && (
                <VendorSalesPage 
                  user={user} 
                  adminOverrideVendor={selectedVendorData} 
                  onBackToAdmin={() => setAppState(user.role === 'vendor' ? 'vendor-detail' : 'admin')} 
                />
              )}
              {appState === 'support' && (
                <SupportPage user={user} f={formatCurrency} t={t} />
              )}
              {appState === 'user-support' && (
                <UserSupportPage user={user} t={t} />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
