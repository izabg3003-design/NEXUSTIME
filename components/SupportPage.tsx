
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, LayoutDashboard, DollarSign, FileText, LifeBuoy, X, ArrowLeft, Info, ExternalLink, ShieldCheck, Mail, Phone, Calendar, MessageSquare, Clock, Send, Headphones, CheckCircle, ReceiptText, Euro, ShieldAlert, Percent, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, WorkRecord } from '../types';

interface Props {
  user: UserProfile;
  f: (val: number) => string;
  t: (key: string) => any;
}

const SupportPage: React.FC<Props> = ({ user, f, t }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'active_chats'>('active_chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<'info' | 'dashboard' | 'chat'>('chat');
  
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [chatMessages]);

  // Sincronização em Tempo Real da LISTA DE TICKETS (Apenas Abertos e Disponíveis/Meus)
  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, profiles(*)')
      .eq('status', 'open')
      .or(`agent_id.is.null,agent_id.eq.${user.id}`) // Mostrar apenas não atribuídos ou atribuídos a mim
      .order('updated_at', { ascending: false });
    setActiveChats(data || []);
  };

  useEffect(() => {
    fetchTickets();

    const ticketChannel = supabase.channel('nexus_support_exclusive_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(ticketChannel); };
  }, [user.id]);

  // Sincronização em Tempo Real das MENSAGENS
  useEffect(() => {
    if (activeView !== 'chat' || !selectedUser?.id) return;

    const fetchMsgs = async () => {
       const { data } = await supabase.from('chat_messages').select('*').eq('user_id', selectedUser.id).order('created_at', { ascending: true });
       setChatMessages(data || []);
    };
    fetchMsgs();

    const chatChannel = supabase.channel(`nexus_chat_agent_${selectedUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `user_id=eq.${selectedUser.id}` 
      }, payload => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(chatChannel); };
  }, [activeView, selectedUser?.id]);

  const selectUser = async (target: UserProfile) => {
    setLoading(true);
    
    // Tentar resgatar o ticket (Marcar como meu atendimento)
    // Usamos agent_id IS NULL para garantir que ninguém pegou no milissegundo de diferença
    const { error: claimError } = await supabase
      .from('support_tickets')
      .update({ agent_id: user.id, updated_at: new Date().toISOString() })
      .eq('user_id', target.id)
      .is('agent_id', null);

    // Se der erro ou não atualizar nada (porque agent_id já não era null), significa que outro colega pegou
    if (claimError) {
      alert("Este atendimento já foi assumido por outro colega de suporte.");
      setLoading(false);
      fetchTickets();
      return;
    }

    setSelectedUser(target);
    setActiveView(activeTab === 'active_chats' ? 'chat' : 'info');
    setLoading(false);
  };

  const backToList = async () => {
    if (selectedUser?.id) {
      // Libertar o ticket para que outros agentes possam ver na fila se eu não resolver
      await supabase
        .from('support_tickets')
        .update({ agent_id: null })
        .eq('user_id', selectedUser.id)
        .eq('status', 'open');
    }
    setSelectedUser(null);
    fetchTickets();
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser?.id) return;
    
    const currentReply = replyText;
    setReplyText('');
    
    await supabase.from('chat_messages').insert({ 
      user_id: selectedUser.id, 
      text: currentReply, 
      sender_role: 'support' 
    });
    
    await supabase.from('support_tickets').update({
       last_message: currentReply,
       updated_at: new Date().toISOString()
    }).eq('user_id', selectedUser.id);
  };

  const resolveTicket = async (userId: string) => {
    await supabase
      .from('support_tickets')
      .update({ status: 'resolved', agent_id: user.id, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    setSelectedUser(null);
    fetchTickets();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(20);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNexusId = (profile: any) => {
    try {
      const sub = typeof profile.subscription === 'string' ? JSON.parse(profile.subscription) : profile.subscription;
      return sub?.id || profile.id?.substring(0, 8);
    } catch { return profile.id?.substring(0, 8); }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Staff Atendimento Hub</span>
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">PAINEL DE <span className="text-blue-400">SUPORTE</span></h2>
        </div>
        
        <div className="flex p-1 bg-slate-800/40 rounded-2xl border border-white/5">
           <button onClick={() => setActiveTab('active_chats')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active_chats' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Fila de Espera ({activeChats.length})</button>
           <button onClick={() => setActiveTab('search')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'search' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Pesquisar Usuário</button>
        </div>
      </div>

      {selectedUser ? (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
           <div className="bg-slate-800/40 p-6 rounded-[2.5rem] border border-blue-500/20 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                 <button onClick={backToList} className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:text-white transition-all text-slate-500 hover:bg-slate-900"><ArrowLeft className="w-4 h-4" /></button>
                 <div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Em Direto (Exclusivo)</p></div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mt-1">{selectedUser.name}</h3>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => resolveTicket(selectedUser.id!)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500 transition-all shadow-lg"><CheckCircle className="w-4 h-4" /> Marcar Resolvido</button>
                 <div className="bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 flex">
                    {[{ id: 'chat', label: 'Conversa', icon: MessageSquare }, { id: 'info', label: 'Ficha Nexus', icon: Info }].map(v => (
                        <button key={v.id} onClick={() => setActiveView(v.id as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === v.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                          <v.icon className="w-3.5 h-3.5" /> {v.label}
                        </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-slate-800/20 border border-slate-800 rounded-[3rem] p-4 md:p-10 min-h-[550px] shadow-2xl relative overflow-hidden">
              {activeView === 'chat' && (
                <div className="flex flex-col h-[550px] bg-slate-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-inner">
                   <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                      {chatMessages.map(m => (
                        <div key={m.id} className={`flex ${m.sender_role === 'support' ? 'justify-end' : 'justify-start'} animate-[slideUp_0.2s_ease-out]`}>
                           <div className={`p-4 rounded-2xl max-w-[75%] shadow-md ${m.sender_role === 'support' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-300 rounded-tl-none border border-white/5'}`}>
                              <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                              <p className={`text-[8px] font-black uppercase opacity-50 mt-2 ${m.sender_role === 'support' ? 'text-right' : 'text-left'}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                   </div>
                   <form onSubmit={handleSendReply} className="p-5 bg-slate-900 border-t border-white/5 flex gap-3 items-center">
                      <input 
                        type="text" 
                        value={replyText} 
                        onChange={e => setReplyText(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                        placeholder="Responder ao cliente em direto..." 
                      />
                      <button type="submit" disabled={!replyText.trim()} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-20 shadow-xl group">
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                   </form>
                </div>
              )}
              {activeView === 'info' && (
                <div className="space-y-10 animate-[fadeIn_0.5s_ease-out]">
                   <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                      <div className="w-24 h-24 bg-slate-950 border-2 border-blue-500/20 rounded-3xl flex items-center justify-center">
                         <User className="w-12 h-12 text-blue-400" />
                      </div>
                      <div>
                         <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">{selectedUser.name}</h4>
                         <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1">Digital Nexus Identity: <span className="text-white">#{getNexusId(selectedUser)}</span></p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Mail className="w-3 h-3" /> Contactos Nexus</h5>
                         <div className="space-y-4">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">E-mail Principal</p>
                               <p className="text-sm font-bold text-white">{selectedUser.email}</p>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Telemóvel</p>
                               <p className="text-sm font-bold text-white">{selectedUser.phone || 'NÃO REGISTADO'}</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><DollarSign className="w-3 h-3" /> Configuração Financeira</h5>
                         <div className="space-y-4">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                               <div>
                                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Valor à Hora</p>
                                  <p className="text-lg font-black text-green-400">{f(selectedUser.hourlyRate)}</p>
                               </div>
                               <Euro className="w-5 h-5 text-green-500/30" />
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Regime Fiscal</p>
                               <p className="text-[10px] font-black text-white uppercase">{selectedUser.isFreelancer ? 'Prestação de Serviços (IVA)' : 'Contrato de Trabalho'}</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><ShieldAlert className="w-3 h-3" /> Retenções Ativas</h5>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center">
                               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">IRS</p>
                               <p className="text-sm font-black text-rose-500">{selectedUser.irs.value}{selectedUser.irs.type === 'percentage' ? '%' : '€'}</p>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center">
                               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">S.S.</p>
                               <p className="text-sm font-black text-blue-500">{selectedUser.socialSecurity.value}{selectedUser.socialSecurity.type === 'percentage' ? '%' : '€'}</p>
                            </div>
                            <div className="col-span-2 bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center">
                               <p className="text-[8px] font-black text-slate-600 uppercase mb-1">NIF do Colaborador</p>
                               <p className="text-sm font-black text-white tracking-widest">{selectedUser.nif || '---'}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      ) : activeTab === 'active_chats' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
           {activeChats.length === 0 ? (
             <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 opacity-30 border-2 border-dashed border-slate-800 rounded-[3rem]">
               <MessageSquare className="w-16 h-16 text-slate-600" />
               <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em]">Fila de Espera Vazia</p>
             </div>
           ) : activeChats.map(ticket => (
             <button key={ticket.id} onClick={() => selectUser(ticket.profiles)} className="bg-slate-800/20 border border-slate-800 p-8 rounded-[2.5rem] hover:border-blue-500/50 hover:bg-slate-800/40 transition-all text-left group shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4"><div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div></div>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center font-black text-blue-400 text-2xl group-hover:scale-110 transition-transform shadow-inner">{ticket.profiles.name.charAt(0)}</div>
                   <div className="px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">Disponível</div>
                </div>
                <h4 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">{ticket.profiles.name}</h4>
                <p className="text-[11px] text-slate-400 font-medium mb-6 line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">"{ticket.last_message}"</p>
                <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest mt-auto">
                   <Clock className="w-3 h-3" /> Atualizado há {Math.floor((new Date().getTime() - new Date(ticket.updated_at).getTime()) / 60000)}m
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
           <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input type="text" placeholder="Nome ou Email do colaborador Nexus..." className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] pl-16 py-6 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </form>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && <div className="col-span-full py-10 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}
              {!loading && searchResults.map(res => (
                <button key={res.id} onClick={() => selectUser(res)} className="flex items-center justify-between p-6 bg-slate-900/40 border border-slate-800 rounded-3xl hover:bg-slate-800/60 hover:border-blue-500/30 transition-all group shadow-md">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-blue-400 shadow-inner group-hover:bg-slate-950 transition-colors">{res.name.charAt(0)}</div>
                      <div className="text-left">
                         <p className="text-sm font-bold text-white leading-none">{res.name}</p>
                         <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-black">{res.email}</p>
                      </div>
                   </div>
                   <ExternalLink className="w-5 h-5 text-slate-700 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
