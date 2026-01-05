
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, Search, Loader2, RefreshCw, UserPlus, X, Trash2, ShieldAlert, Phone, Hash, User, ShoppingCart, Mail, Settings2, Save, Euro, CheckCircle, Fingerprint, BriefcaseBusiness, LifeBuoy, Eye, Clock, Lock, Tag, UserPlus2, Percent, CalendarDays, Activity, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import AdminPartnerReports from './AdminPartnerReports';
import AdminGlobalAnalytics from './AdminGlobalAnalytics';
import SettingsPage from './SettingsPage';
import { differenceInDays, addYears, parseISO } from 'date-fns';

interface Props {
  currentUser?: UserProfile;
  f: (val: number) => string;
  onLogout: () => void;
  onViewVendor?: (id: string) => void;
  onViewVendorSales?: (vendor: any) => void;
  t: (key: string) => any;
  onUpdateProfile: (user: UserProfile) => Promise<boolean>;
}

const generateNexusId = () => {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).substr(2, 4).toUpperCase();
  const serial = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `DX-${year}-${hex}-${serial}-NX`;
};

const AdminPage: React.FC<Props> = ({ currentUser, f, onLogout, onViewVendor, onViewVendorSales, t, onUpdateProfile }) => {
  const isMaster = currentUser?.email === 'master@digitalnexus.com';
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'vendors' | 'reports' | 'analytics' | 'support' | 'profile'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [supportStaff, setSupportStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddSupport, setShowAddSupport] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'user' | 'vendor' | 'support' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingVendorConfig, setEditingVendorConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [generatedId, setGeneratedId] = useState('');
  const [generatedVCode, setGeneratedVCode] = useState('');

  const [newUser, setNewUser] = useState({ 
    name: '', email: '', phone: '', vendor_code: '', password: '', confirmPassword: '' 
  });

  const [newVendor, setNewVendor] = useState({
    name: '', email: '', phone: '', commission: 1.50, password: '', confirmPassword: ''
  });

  const [newSupport, setNewSupport] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });

  const openAddUserModal = () => {
    setGeneratedId(generateNexusId());
    setShowAddUser(true);
  };

  const openAddVendorModal = () => {
    setGeneratedVCode('NX-' + Math.random().toString(36).substr(2, 5).toUpperCase());
    setShowAddVendor(true);
  };

  const openAddSupportModal = () => {
    setShowAddSupport(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('role', 'vendor')
          .neq('role', 'support')
          .neq('email', 'master@digitalnexus.com');
        if (error) throw error;
        setUsers(data || []);
      } else if (activeSubTab === 'vendors') {
        const { data: vData, error: vError } = await supabase.from('vendors').select('*');
        if (vError) throw vError;
        if (vData && vData.length > 0) {
          const { data: pData } = await supabase.from('profiles').select('*').in('id', vData.map(v => v.id));
          const merged = vData.map(v => ({
            ...v,
            profile: pData?.find(p => p.id === v.id)
          }));
          setVendors(merged);
        } else { setVendors([]); }
      } else if (activeSubTab === 'support') {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'support');
        if (error) throw error;
        setSupportStaff(data || []);
      }
    } catch (e: any) { 
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    if (activeSubTab !== 'profile' && activeSubTab !== 'reports' && activeSubTab !== 'analytics') {
      fetchData(); 
    }
  }, [activeSubTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.password !== newUser.confirmPassword) { alert("As senhas não coincidem!"); return; }
    setIsCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: { data: { full_name: newUser.name } }
      });
      if (authError) throw authError;
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          vendor_code: newUser.vendor_code?.trim().toUpperCase() || null,
          role: 'user',
          hourlyRate: 10,
          subscription: { 
            id: generatedId, 
            startDate: new Date().toISOString(), 
            isActive: true,
            status: 'ACTIVE_MANUAL_ADMIN'
          }
        });
        if (profileError) throw profileError;
        setShowAddUser(false);
        setNewUser({ name: '', email: '', phone: '', vendor_code: '', password: '', confirmPassword: '' });
        fetchData();
      }
    } catch (e: any) { alert(e.message); } finally { setIsCreating(false); }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendor.password !== newVendor.confirmPassword) { alert("As senhas não coincidem!"); return; }
    setIsCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newVendor.email,
        password: newVendor.password,
        options: { data: { full_name: newVendor.name } }
      });
      if (authError) throw authError;
      if (authData.user) {
        const autoVendorNexusId = 'VEND-' + generatedVCode;
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: newVendor.name,
          email: newVendor.email,
          role: 'vendor',
          vendor_code: generatedVCode,
          subscription: { id: autoVendorNexusId, startDate: new Date().toISOString(), isActive: true, custom_commission: newVendor.commission }
        });
        await supabase.from('vendors').insert({
          id: authData.user.id,
          name: newVendor.name,
          email: newVendor.email,
          code: generatedVCode,
          commission_rate: newVendor.commission
        });
        setShowAddVendor(false);
        setNewVendor({ name: '', email: '', phone: '', commission: 1.50, password: '', confirmPassword: '' });
        fetchData();
      }
    } catch (e: any) { alert(e.message); } finally { setIsCreating(false); }
  };

  const handleCreateSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupport.password !== newSupport.confirmPassword) { alert("As senhas não coincidem!"); return; }
    setIsCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newSupport.email,
        password: newSupport.password,
        options: { data: { full_name: newSupport.name } }
      });
      if (authError) throw authError;
      if (authData.user) {
        const autoSupportNexusId = 'SUPP-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: newSupport.name,
          email: newSupport.email,
          role: 'support',
          subscription: { id: autoSupportNexusId, startDate: new Date().toISOString(), isActive: true }
        });
        setShowAddSupport(false);
        setNewSupport({ name: '', email: '', password: '', confirmPassword: '' });
        fetchData();
      }
    } catch (e: any) { alert(e.message); } finally { setIsCreating(false); }
  };

  const executeDeletion = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'vendor') await supabase.from('vendors').delete().eq('id', itemToDelete.id);
      await supabase.from('work_records').delete().eq('user_id', itemToDelete.id);
      await supabase.from('chat_messages').delete().eq('user_id', itemToDelete.id);
      await supabase.from('support_tickets').delete().eq('user_id', itemToDelete.id);
      const { error } = await supabase.from('profiles').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      fetchData();
      setItemToDelete(null);
    } catch (e: any) { alert(e.message); } finally { setIsDeleting(false); }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const { data: profile } = await supabase.from('profiles').select('subscription').eq('id', id).single();
      let sub = typeof profile?.subscription === 'string' ? JSON.parse(profile.subscription) : (profile?.subscription || {});
      const updatedSub = { ...sub, isActive: !currentStatus };
      await supabase.from('profiles').update({ subscription: updatedSub }).eq('id', id);
      fetchData();
    } catch (e) { console.error(e); } finally { setUpdatingId(null); }
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (activeSubTab === 'users') return users.filter(u => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
    if (activeSubTab === 'support') return supportStaff.filter(s => s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term));
    if (activeSubTab === 'vendors') return vendors.filter(v => v.name?.toLowerCase().includes(term) || v.code?.toLowerCase().includes(term));
    return [];
  }, [users, vendors, supportStaff, activeSubTab, searchTerm]);

  const getIsActive = (item: any) => {
    const sub = (activeSubTab === 'vendors') ? (item.profile?.subscription || item.subscription) : item.subscription;
    const parsed = typeof sub === 'string' ? JSON.parse(sub) : (sub || {});
    return parsed.isActive ?? true;
  };

  const getItemNexusId = (item: any) => {
    try {
      const sub = (activeSubTab === 'vendors') ? (item.profile?.subscription || item.subscription) : item.subscription;
      const parsed = typeof sub === 'string' ? JSON.parse(sub) : (sub || {});
      return parsed.id || '---';
    } catch { return '---'; }
  };

  const getDaysRemaining = (item: any) => {
    try {
      const sub = (activeSubTab === 'vendors') ? (item.profile?.subscription || item.subscription) : item.subscription;
      const parsed = typeof sub === 'string' ? JSON.parse(sub) : (sub || {});
      if (!parsed.startDate) return '---';
      const expiry = addYears(parseISO(parsed.startDate), 1);
      const days = differenceInDays(expiry, new Date());
      return days > 0 ? `${days} dias` : 'Expirado';
    } catch (e) { return '---'; }
  };

  const handleSaveVendorConfig = async () => {
    if (!editingVendorConfig) return;
    setIsSavingConfig(true);
    try {
      const { error: vError } = await supabase.from('vendors').update({
        commission_rate: editingVendorConfig.commission_rate
      }).eq('id', editingVendorConfig.id);
      if (vError) throw vError;

      const { data: profile } = await supabase.from('profiles').select('subscription').eq('id', editingVendorConfig.id).single();
      let sub: any = {};
      try { 
        sub = typeof profile?.subscription === 'string' ? JSON.parse(profile.subscription) : (profile?.subscription || {}); 
      } catch(e) { sub = {}; }
      
      const updatedSub = {
        ...sub,
        custom_commission: editingVendorConfig.commission_rate,
        custom_discount: editingVendorConfig.discount_rate
      };

      const { error: pError } = await supabase.from('profiles').update({ 
        subscription: updatedSub 
      }).eq('id', editingVendorConfig.id);
      
      if (pError) throw pError;

      setEditingVendorConfig(null);
      fetchData();
    } catch (e: any) {
      alert(`Erro ao salvar e sincronizar: ${e.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openVendorConfig = (item: any) => {
    let sub: any = {};
    try { 
      sub = typeof item.profile?.subscription === 'string' ? JSON.parse(item.profile.subscription) : (item.profile?.subscription || {}); 
    } catch(e) { sub = {}; }
    
    setEditingVendorConfig({
      ...item,
      discount_rate: sub.custom_discount ?? 5,
      commission_rate: item.commission_rate ?? sub.custom_commission ?? 1.50
    });
  };

  const tableColCount = (activeSubTab === 'users' || activeSubTab === 'vendors') ? 5 : 4;

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] pb-64">
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isMaster ? 'text-amber-500' : 'text-purple-400'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{isMaster ? 'Nexus Master Core Management' : 'Digital Nexus Command OS'}</span>
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">NEXUS <span className={isMaster ? 'text-amber-500' : 'text-purple-400'}>{isMaster ? 'MASTER' : 'COMMAND'}</span></h2>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex-wrap">
          {isMaster && (
            <button onClick={() => setActiveSubTab('analytics')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'analytics' ? 'bg-amber-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Estatísticas</button>
          )}
          <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'users' ? (isMaster ? 'bg-amber-600' : 'bg-purple-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Membros</button>
          <button onClick={() => setActiveSubTab('vendors')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'vendors' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Parceiros</button>
          <button onClick={() => setActiveSubTab('support')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'support' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Suporte</button>
          <button onClick={() => setActiveSubTab('reports')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'reports' ? 'bg-amber-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Comissões</button>
          <button onClick={() => setActiveSubTab('profile')} className={`px-4 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${activeSubTab === 'profile' ? 'bg-slate-200 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <Settings className="w-3.5 h-3.5 inline mr-1" /> Perfil Master
          </button>
        </div>
      </div>

      {activeSubTab === 'analytics' ? <AdminGlobalAnalytics f={f} /> : 
       activeSubTab === 'reports' ? <AdminPartnerReports f={f} /> : 
       activeSubTab === 'profile' ? <SettingsPage user={currentUser!} setUser={onUpdateProfile} t={t} /> : (
        <div className="bg-slate-800/20 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl relative">
          <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-900/40">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Pesquisar..." className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {activeSubTab === 'users' ? (
              <button onClick={openAddUserModal} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"><UserPlus className="w-4 h-4" /> Novo Membro</button>
            ) : activeSubTab === 'vendors' ? (
              <button onClick={openAddVendorModal} className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"><BriefcaseBusiness className="w-4 h-4" /> Novo Parceiro</button>
            ) : activeSubTab === 'support' ? (
              <button onClick={openAddSupportModal} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"><LifeBuoy className="w-4 h-4" /> Novo Suporte</button>
            ) : null}
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/30 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-800">
                  <th className="px-10 py-6">ID Nexus</th>
                  <th className="px-10 py-6">Entidade</th>
                  {(activeSubTab === 'users' || activeSubTab === 'vendors') && (
                    <th className="px-6 py-6 text-center">Expiração / Dias</th>
                  )}
                  <th className="px-6 py-6 text-center">Status</th>
                  <th className="px-10 py-6 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {loading ? (
                  <tr><td colSpan={tableColCount} className="py-20 text-center"><Loader2 className="w-10 h-10 text-white animate-spin mx-auto" /></td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={tableColCount} className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest">Nenhum registo.</td></tr>
                ) : filteredItems.map((item: any) => {
                  const isActive = getIsActive(item);
                  const daysLeft = getDaysRemaining(item);
                  const nexusId = getItemNexusId(item);
                  return (
                    <tr key={item.id} className="transition-all hover:bg-slate-800/40">
                      <td className="px-10 py-6">
                        <span className="text-[11px] font-black text-slate-400 font-mono tracking-widest uppercase">{nexusId}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black uppercase ${activeSubTab === 'users' ? 'text-purple-500' : activeSubTab === 'vendors' ? 'text-green-500' : 'text-blue-500'}`}>{item.name?.charAt(0)}</div>
                          <div><p className="font-bold text-white text-sm">{item.name}</p><p className="text-[9px] text-slate-500 uppercase font-black">{item.email}</p></div>
                        </div>
                      </td>
                      {(activeSubTab === 'users' || activeSubTab === 'vendors') && (
                        <td className="px-6 py-6 text-center">
                           <div className="flex flex-col items-center gap-1">
                              <span className={`text-[10px] font-black ${daysLeft === 'Expirado' ? 'text-rose-500' : 'text-slate-300'}`}>{daysLeft}</span>
                              <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-2/3"></div></div>
                           </div>
                        </td>
                      )}
                      <td className="px-6 py-6 text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${ isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{isActive ? 'ACTIVO' : 'SUSPENSO'}</div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isMaster && activeSubTab === 'vendors' && (
                            <>
                              <button onClick={() => onViewVendor?.(item.id)} className="p-2.5 bg-green-600/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-600 hover:text-white transition-all" title="Ver Página"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => onViewVendorSales?.(item)} className="p-2.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Ver Gaveta de Vendas"><ShoppingCart className="w-4 h-4" /></button>
                              <button onClick={() => openVendorConfig(item)} className="p-2.5 bg-amber-600/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-600 hover:text-white transition-all" title="Configurar Comissões"><Settings2 className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => handleToggleStatus(item.id, isActive)} disabled={updatingId === item.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:text-white text-slate-500">
                            <RefreshCw className={`w-4 h-4 ${updatingId === item.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button onClick={() => setItemToDelete({ id: item.id, name: item.name, type: activeSubTab === 'users' ? 'user' : activeSubTab === 'vendors' ? 'vendor' : 'support' })} className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÃO DE COMISSÃO INDIVIDUAL (MASTER ONLY) */}
      {editingVendorConfig && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => !isSavingConfig && setEditingVendorConfig(null)}></div>
          <div className="relative bg-slate-900 w-full max-w-md rounded-[3rem] border border-amber-500/30 overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out]">
            <div className="p-8 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Settings2 className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">CONFIG <span className="text-amber-500">PARCEIRO</span></h3>
               </div>
               <button onClick={() => setEditingVendorConfig(null)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">A ajustar parâmetros para:</p>
                  <p className="text-lg font-black text-white italic">{editingVendorConfig.name}</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-amber-500/70 uppercase flex items-center gap-2"><Euro className="w-3 h-3" /> Comissão por Venda (€)</label>
                    <div className="relative">
                      <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      <input 
                        type="number" 
                        step="0.01" 
                        value={editingVendorConfig.commission_rate} 
                        onChange={e => setEditingVendorConfig({...editingVendorConfig, commission_rate: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-black outline-none focus:ring-1 focus:ring-amber-500" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-amber-500/70 uppercase flex items-center gap-2"><Percent className="w-3 h-3" /> Desconto para Clientes (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      <input 
                        type="number" 
                        step="1" 
                        value={editingVendorConfig.discount_rate} 
                        onChange={e => setEditingVendorConfig({...editingVendorConfig, discount_rate: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white font-black outline-none focus:ring-1 focus:ring-amber-500" 
                      />
                    </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setEditingVendorConfig(null)} className="flex-1 py-5 bg-slate-800 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancelar</button>
                  <button onClick={handleSaveVendorConfig} disabled={isSavingConfig} className="flex-1 py-5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all">
                    {isSavingConfig ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    SALVAR AJUSTE
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR MEMBRO (Checkout Style) */}
      {showAddUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/80 overflow-y-auto">
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-purple-500/30 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out] my-auto">
            <div className="p-8 bg-purple-600/10 border-b border-purple-500/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <UserPlus2 className="w-6 h-6 text-purple-400" />
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Manual <span className="text-purple-400">Identity Checkout</span></h3>
              </div>
              <button type="button" onClick={() => setShowAddUser(false)} className="text-slate-500 hover:text-white p-2 bg-slate-950/50 rounded-xl border border-slate-800 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="bg-slate-950 border border-purple-500/30 p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-2 shadow-inner">
                 <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em]">Identidade Nexus Gerada</p>
                 <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-slate-600" />
                    <span className="text-2xl font-black text-white font-mono tracking-widest">{generatedId}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-bold" placeholder="Titular Nexus" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-bold" placeholder="email@nexus.com" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Telemóvel</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-bold" placeholder="+351 912..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a Parceiro (Opcional)</label>
                  <div className="relative">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input value={newUser.vendor_code} onChange={e => setNewUser({...newUser, vendor_code: e.target.value.toUpperCase()})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-black" placeholder="NX-ABCDE" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-950/50 rounded-[2.5rem] border border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Definir Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-bold" placeholder="••••••••" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Confirmar Senha</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input type="password" required value={newUser.confirmPassword} onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-1 focus:ring-purple-500 outline-none font-bold" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Digital Nexus Solutions • Manual Registration v16.0</p>
                 <button disabled={isCreating} className="w-full py-6 bg-purple-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-[0_15px_40px_rgba(124,58,237,0.3)] hover:bg-purple-500 transition-all flex items-center justify-center gap-4 active:scale-[0.98]">
                  {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />} ATIVAR IDENTIDADE NEXUS
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADICIONAR PARCEIRO */}
      {showAddVendor && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/80">
          <form onSubmit={handleCreateVendor} className="bg-slate-900 border border-green-500/30 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out]">
            <div className="p-8 bg-green-600/10 border-b border-green-500/20 flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Novo <span className="text-green-400">Parceiro</span></h3>
              <button type="button" onClick={() => setShowAddVendor(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Nome Comercial</label><input required value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Email de Acesso</label><input type="email" required value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Código de Parceiro Nexus (Automático)</label><div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-green-500 font-mono font-black">{generatedVCode}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Senha</label><input type="password" required value={newVendor.password} onChange={e => setNewVendor({...newVendor, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Confirmar</label><input type="password" required value={newVendor.confirmPassword} onChange={e => setNewVendor({...newVendor, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
              </div>
              <button disabled={isCreating} className="w-full py-5 bg-green-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-green-500 transition-all flex items-center justify-center gap-3">
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BriefcaseBusiness className="w-5 h-5" />} ATIVAR PARCEIRO COMERCIAL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADICIONAR SUPORTE */}
      {showAddSupport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/80">
          <form onSubmit={handleCreateSupport} className="bg-slate-900 border border-blue-500/30 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-[modalScale_0.3s_ease-out]">
            <div className="p-8 bg-blue-600/10 border-b border-blue-500/20 flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Novo <span className="text-blue-400">Suporte</span></h3>
              <button type="button" onClick={() => setShowAddSupport(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Nome</label><input required value={newSupport.name} onChange={e => setNewSupport({...newSupport, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Email</label><input type="email" required value={newSupport.email} onChange={e => setNewSupport({...newSupport, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Senha</label><input type="password" required value={newSupport.password} onChange={e => setNewSupport({...newSupport, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Confirmar</label><input type="password" required value={newSupport.confirmPassword} onChange={e => setNewSupport({...newSupport, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white" /></div>
              </div>
              <button disabled={isCreating} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3">
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LifeBuoy className="w-5 h-5" />} ATIVAR AGENTE SUPORTE
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EXCLUIR CONTA */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90">
          <div className="bg-slate-900 border border-red-500/40 w-full max-w-md rounded-[3rem] p-10 text-center space-y-8 shadow-[0_0_80px_rgba(239,68,68,0.2)] animate-[modalScale_0.3s_ease-out]">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 text-red-500 mx-auto shadow-lg"><ShieldAlert className="w-10 h-10" /></div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">EXCLUSÃO <span className="text-red-500">CRÍTICA</span></h3>
              <p className="text-slate-400 text-sm font-medium">Estás prestes a eliminar permanentemente a conta de <span className="text-white font-black">{itemToDelete.name}</span>. Todos os registos financeiros serão apagados da Nexus Cloud.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={executeDeletion} disabled={isDeleting} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-500 transition-all flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} CONFIRMAR APAGAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
