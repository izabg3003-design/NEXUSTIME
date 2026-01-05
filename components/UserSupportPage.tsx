import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, LifeBuoy, Loader2, Sparkles, MessageSquare, Headphones, ArrowLeft, History, Wifi, AlertTriangle, CheckCircle2, Clock, Info, Moon, Sun } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'support';
  text: string;
  timestamp: Date;
}

interface Ticket {
  id: string;
  status: string;
  subject: string;
  last_message: string;
  updated_at: string;
}

interface Props {
  user: UserProfile;
  t: (key: string) => any;
}

const UserSupportPage: React.FC<Props> = ({ user, t }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHumanSupportActive, setIsHumanSupportActive] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'online' | 'offline' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAgentsOnline, setIsAgentsOnline] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  }, []);

  // Verificar se há agentes online (atividade nos últimos 2 minutos)
  const checkAgentsAvailability = useCallback(async () => {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['support', 'admin'])
        .gt('updated_at', twoMinutesAgo);
      
      if (error) throw error;
      const online = (count || 0) > 0;
      setIsAgentsOnline(online);
      
      if (isHumanSupportActive) {
        setConnectionStatus(online ? 'online' : 'offline');
      }
      return online;
    } catch (e) {
      console.error("Erro ao verificar agentes:", e);
      setIsAgentsOnline(false);
      return false;
    }
  }, [isHumanSupportActive]);

  useEffect(() => {
    const interval = setInterval(checkAgentsAvailability, 30000);
    return () => clearInterval(interval);
  }, [checkAgentsAvailability]);

  // 1. CARREGAR ESTADO INICIAL
  useEffect(() => {
    const initializeChat = async () => {
      if (!user.id) return;
      setIsLoadingHistory(true);
      await checkAgentsAvailability();
      
      try {
        const { data: ticket } = await supabase
          .from('support_tickets')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        const isLive = ticket?.status === 'open';
        setIsHumanSupportActive(isLive);
        
        const { data: dbMessages, error: msgsError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (msgsError) throw msgsError;

        if (dbMessages && dbMessages.length > 0) {
          const formatted = dbMessages.map(m => ({
            id: m.id,
            role: m.sender_role as any,
            text: m.text,
            timestamp: new Date(m.created_at)
          }));
          setMessages(formatted);
        } else {
          setMessages([{ 
            id: 'welcome', 
            role: 'ai', 
            text: `Olá ${user.name.split(' ')[0]}! Sou a assistente virtual da Digital Nexus Solutions. Como posso ajudar-te hoje?`, 
            timestamp: new Date() 
          }]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar chat:", err);
        setErrorMessage("Não foi possível carregar o histórico.");
      } finally {
        setIsLoadingHistory(false);
        scrollToBottom("auto");
      }
    };

    initializeChat();
  }, [user.id, user.name, scrollToBottom, checkAgentsAvailability]);

  // 2. BUSCAR HISTÓRICO
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user.id || view !== 'history') return;
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'resolved')
        .order('updated_at', { ascending: false });
      setResolvedTickets(data || []);
    };
    fetchHistory();
  }, [user.id, view]);

  // 3. REALTIME
  useEffect(() => {
    if (!user.id) return;

    const channel = supabase.channel(`nexus_chat_sync_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${user.id}` }, payload => {
        const msg = payload.new;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          if (msg.sender_role === 'support') {
            setIsHumanSupportActive(true);
            setConnectionStatus('online');
          }
          return [...prev, { id: msg.id, role: msg.sender_role as any, text: msg.text, timestamp: new Date(msg.created_at) }];
        });
        scrollToBottom();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` }, payload => {
        const updatedTicket = payload.new;
        if (updatedTicket.status === 'resolved') {
          setIsHumanSupportActive(false);
          setConnectionStatus('idle');
        } else if (updatedTicket.status === 'open') {
          setIsHumanSupportActive(true);
          checkAgentsAvailability();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, scrollToBottom, checkAgentsAvailability]);

  // @google/genai logic for handling sent messages
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText;
    setInputText('');
    const tempId = 'temp-' + Date.now();

    const newUserMsg: Message = { id: tempId, role: 'user', text: currentText, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    scrollToBottom();

    if (isHumanSupportActive) {
      // Send message to Supabase for human agent
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        text: currentText,
        sender_role: 'user'
      });
      await supabase.from('support_tickets').update({
        last_message: currentText,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
    } else {
      // Logic for AI Response using Gemini API
      setIsTyping(true);
      try {
        // Fixed: Used process.env.API_KEY directly as required by Gemini SDK guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare chat history for Gemini model
        const chatHistory = messages
          .filter(m => m.role === 'user' || m.role === 'ai')
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [...chatHistory, { role: 'user', parts: [{ text: currentText }] }],
          config: {
            systemInstruction: "Tu és a assistente virtual da Digital Nexus Solutions. Ajudas os utilizadores com a plataforma NexusTime (gestão de horas, finanças, relatórios). Sê profissional, direta e empática. Se não conseguires resolver algo técnico, sugere falar com um agente humano."
          }
        });

        const aiText = response.text || "Lamento, ocorreu um erro ao processar a tua resposta.";
        const aiMsg: Message = { id: Date.now().toString(), role: 'ai', text: aiText, timestamp: new Date() };
        
        setMessages(prev => [...prev, aiMsg]);
        
        // Persist AI chat in database
        await supabase.from('chat_messages').insert([
          { user_id: user.id, text: currentText, sender_role: 'user' },
          { user_id: user.id, text: aiText, sender_role: 'ai' }
        ]);

      } catch (err: any) {
        console.error("Gemini API Error:", err);
        const errorMsg: Message = { 
          id: 'err-' + Date.now(), 
          role: 'ai', 
          text: "Lamento, estou com dificuldades técnicas de momento. Podes tentar novamente ou pedir para falar com um agente humano.", 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        scrollToBottom();
      }
    }
  };

  const startHumanSupport = async () => {
    setConnectionStatus('connecting');
    try {
      const isOnline = await checkAgentsAvailability();
      
      const { error } = await supabase.from('support_tickets').upsert({
        user_id: user.id,
        status: 'open',
        last_message: 'Solicitação de suporte humano.',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setIsHumanSupportActive(true);
      setConnectionStatus(isOnline ? 'online' : 'offline');
      
      const sysMsg: Message = { 
        id: 'sys-' + Date.now(), 
        role: 'support', 
        text: isOnline 
          ? "A conectar-te a um agente de suporte... Por favor, aguarda um momento." 
          : "De momento não há agentes online, mas a tua mensagem foi registada e responderemos assim que possível.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, sysMsg]);
      scrollToBottom();
    } catch (err) {
      setConnectionStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/20">
            <LifeBuoy className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Nexus <span className="text-blue-400">Support</span></h2>
            <div className="flex items-center gap-2 mt-1">
              {isHumanSupportActive ? (
                <>
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{connectionStatus === 'online' ? 'Agente em Direto' : 'A aguardar agente...'}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nexus Intelligence AI</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex p-1 bg-slate-950/50 rounded-2xl border border-white/5">
           <button onClick={() => setView('chat')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Chat</button>
           <button onClick={() => setView('history')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Histórico</button>
        </div>
      </div>

      {view === 'chat' ? (
        <div className="bg-slate-800/20 border border-slate-800 rounded-[3rem] p-4 md:p-8 flex flex-col h-[650px] shadow-2xl overflow-hidden backdrop-blur-sm">
           <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {isLoadingHistory ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">A carregar conversa...</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={m.id || idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[slideUp_0.3s_ease-out]`}>
                    <div className="flex items-start gap-3 max-w-[85%]">
                      {m.role !== 'user' && (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${m.role === 'support' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                          {m.role === 'support' ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl shadow-lg ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900/80 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                        <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                        <p className="text-[8px] font-black uppercase opacity-40 mt-2 text-right">
                          {format(m.timestamp, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 flex gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
           </div>

           <div className="mt-4 p-4 space-y-4">
              {!isHumanSupportActive && !isLoadingHistory && (
                <button onClick={startHumanSupport} className="w-full py-3 bg-slate-900/60 border border-blue-500/20 rounded-2xl text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/10 transition-all flex items-center justify-center gap-2">
                  <Headphones className="w-3.5 h-3.5" /> Falar com um Agente Humano
                </button>
              )}
              
              <form onSubmit={handleSend} className="flex gap-3 bg-slate-900/80 p-3 rounded-[2rem] border border-white/10 shadow-xl">
                 <input 
                   type="text" 
                   value={inputText} 
                   onChange={e => setInputText(e.target.value)} 
                   placeholder="Diz-me algo ou coloca uma dúvida..." 
                   className="flex-1 bg-transparent px-4 py-2 text-white text-sm outline-none placeholder:text-slate-600 font-medium"
                 />
                 <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-20 group">
                   <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </button>
              </form>
           </div>
        </div>
      ) : (
        <div className="bg-slate-800/20 border border-slate-800 rounded-[3rem] p-8 space-y-6 min-h-[500px]">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
             <History className="w-5 h-5 text-blue-400" /> Histórico de Chamados
           </h3>
           <div className="grid grid-cols-1 gap-4">
              {resolvedTickets.length === 0 ? (
                <div className="py-20 text-center opacity-30">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum chamado anterior.</p>
                </div>
              ) : resolvedTickets.map(t => (
                <div key={t.id} className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{format(new Date(t.updated_at), 'dd MMM yyyy')}</p>
                      <h4 className="text-white font-bold italic truncate max-w-md">"{t.last_message}"</h4>
                   </div>
                   <div className="px-4 py-1 bg-green-500/10 border border-green-500/20 rounded-full"><span className="text-[8px] font-black text-green-400 uppercase">Resolvido</span></div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default UserSupportPage;