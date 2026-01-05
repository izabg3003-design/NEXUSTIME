import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Zap, Clock, Wallet, Mail, ShieldAlert, Star, TrendingUp, FileText, Quote
} from 'lucide-react';
import { Language } from '../types';

interface Props {
  onLogin: () => void;
  onSubscribe: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
  t: (key: string) => any;
  lang: Language;
  setLang: (l: Language) => void;
}

const LandingPage: React.FC<Props> = ({ onLogin, onSubscribe, onPrivacy, onTerms, t, lang, setLang }) => {
  const [scrolled, setScrolled] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const testimonials = [
    {
      name: "Carlos Ferreira",
      role: "Consultor Independente",
      text: "Recuperei mais de 1.200€ em horas que simplesmente esquecia de faturar. O NexusTime mudou o meu negócio.",
      stars: 5
    },
    {
      name: "Ana Rita Santos",
      role: "Architect & Project Manager",
      text: "A clareza sobre o IRS e Segurança Social permite-me dormir descansada. É a melhor ferramenta de gestão em Portugal.",
      stars: 5
    },
    {
      name: "Miguel Oliveira",
      role: "Software Engineer Freelancer",
      text: "Interface de elite. Organizo toda a minha contabilidade em segundos. O suporte da Digital Nexus é impecável.",
      stars: 5
    }
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [testimonials.length]);

  const PromoBanner = () => (
    <div className="max-w-4xl mx-auto px-6 mb-12 animate-soft">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 rounded-[3rem] p-8 md:p-12 border border-emerald-500/30 shadow-[0_30px_70px_rgba(0,0,0,0.4)] overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Star className="w-32 h-32 text-emerald-500 fill-emerald-500" />
        </div>
        
        <div className="absolute top-6 right-6 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse z-20">
          Oferta de Lançamento
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Licença Digital Nexus
              </p>
              <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase leading-tight tracking-tighter">Vantagens <br/><span className="text-emerald-400">Exclusivas Elite:</span></h3>
            </div>
            
            <ul className="grid grid-cols-1 gap-4">
              {[
                { icon: Clock, text: "Registo de Horas Atómico" },
                { icon: Wallet, text: "Cálculo Automático de Impostos" },
                { icon: FileText, text: "Relatórios PDF para Contabilista" },
                { icon: ShieldCheck, text: "Criptografia Nexus Cloud" }
              ].map((adv, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-300 group/item">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                    <adv.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="group-hover/item:text-white transition-colors">{adv.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center p-10 bg-slate-950/60 rounded-[3rem] border border-white/5 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-500 line-through text-lg font-bold opacity-40 italic">29,90€</span>
              <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-[8px] font-black uppercase">50% OFF</span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tracking-tighter">14,99€</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-emerald-500 uppercase leading-none">/Ano</span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">C/ IVA</span>
              </div>
            </div>
            
            <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mt-3 mb-8">Pague Uma Vez, Use o Ano Todo</p>
            
            <button 
              onClick={onSubscribe}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest shadow-[0_15px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Ativar Licença <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden selection:bg-emerald-500/30 font-inter">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[100%] h-[50%] bg-emerald-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[100%] h-[50%] bg-purple-600/5 rounded-full blur-[120px]"></div>
      </div>

      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-4 bg-slate-950/90 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center font-black text-white text-[10px] shadow-lg">DX</div>
            <span className="font-bold text-lg tracking-tighter text-white">Nexus<span className="text-emerald-400">Time</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Login</button>
            <button onClick={onSubscribe} className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 hover:bg-emerald-400">Ativar</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* HERO */}
        <section className="pt-40 md:pt-56 pb-12 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">Digital Nexus Solutions • 2026</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white mb-6 leading-[0.9] uppercase italic">
              TRANSFORME SEGUNDOS EM <br/>
              <span className="text-gradient">LUCRO REAL.</span>
            </h1>
            
            <p className="text-sm md:text-xl text-slate-400 mb-12 max-w-xl mx-auto font-medium leading-relaxed">
              O NexusTime é a única sentinela digital projetada para profissionais que exigem precisão absoluta. Recupere cada segundo de faturamento hoje.
            </p>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="pb-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative h-64 md:h-48 flex items-center justify-center">
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx}
                  className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-1000 transform ${idx === testimonialIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    ))}
                  </div>
                  <div className="relative">
                    <Quote className="absolute -top-4 -left-8 w-8 h-8 text-emerald-500/20" />
                    <p className="text-lg md:text-xl font-medium text-slate-200 italic mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                  </div>
                  <div>
                    <p className="font-black text-white uppercase tracking-widest text-xs">{testimonial.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-500 ${idx === testimonialIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-800'}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CONTRAST PAIN/SOLUTION */}
        <section className="py-20 px-6 bg-slate-950/40 border-y border-white/5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass p-10 rounded-[2.5rem] border-red-500/20 bg-red-500/[0.01]">
              <h2 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" /> O Problema
              </h2>
              <ul className="space-y-4">
                {["Horas extras não faturadas por esquecimento.", "Caos total no cálculo de impostos mensais.", "Falta de clareza sobre o lucro líquido real."].map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-400 font-medium">
                    <span className="text-red-500 font-black">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass p-10 rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/[0.03]">
              <h2 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Solução Nexus
              </h2>
              <ul className="space-y-4">
                {["Rastreio atómico de cada minuto.", "informações centralizadas IRS, SS E IVA", "Relatórios de elite para o contabilista."].map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-200 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* PROMO BANNER */}
        <div className="pt-12">
          <PromoBanner />
        </div>

        {/* SUPPORT */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto glass p-12 rounded-[3.5rem] border-white/10 shadow-2xl">
            <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic">Suporte Técnico Dedicado</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-md mx-auto">
              Dúvidas sobre a plataforma ou faturamento? Nossa equipe de elite está pronta para ajudar.
            </p>
            <a href="mailto:suporte@digitalnexus.com" className="text-2xl font-black text-emerald-400 underline decoration-emerald-500/30 underline-offset-8 hover:text-white transition-colors">
              suporte@digitalnexus.com
            </a>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 -z-10 animate-pulse"></div>
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.8]">
              NÃO PERCA MAIS <br/><span className="text-emerald-400">DINHEIRO HOJE.</span>
            </h2>
            <div className="max-w-sm mx-auto">
               <button onClick={onSubscribe} className="w-full px-12 py-7 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-[2rem] text-xl shadow-[0_0_60px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                <span>Ativar Agora</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-16 px-6 border-t border-white/5 bg-slate-950 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[10px]">DX</div>
              <span className="font-bold text-sm tracking-tighter opacity-50 uppercase">Digital Nexus Solutions</span>
            </div>
            <div className="flex gap-10 text-[10px] font-black text-slate-700 uppercase tracking-widest">
              <a href="mailto:suporte@digitalnexus.com" className="hover:text-emerald-500 transition-colors">Suporte</a>
              <button onClick={onPrivacy} className="hover:text-emerald-500 transition-colors">Privacidade</button>
              <button onClick={onTerms} className="hover:text-emerald-500 transition-colors">Termos</button>
            </div>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.5em]">© 2026 Digital Nexus. Elite Time Management.</p>
          </div>
      </footer>

      <style>{`
        .text-gradient {
          background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-soft {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;