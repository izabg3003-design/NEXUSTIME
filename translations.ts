
export const nexusCurrencies = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
];

const sharedMotivational = [
  "Success is the sum of small efforts repeated day in and day out.",
  "Your only competition is who you were yesterday.",
  "Focus on progress, not perfection.",
  "Discipline is the bridge between goals and accomplishment."
];

export const translations: Record<string, any> = {
  'pt-PT': {
    common: { save: "Guardar", cancel: "Cancelar", close: "Fechar", loading: "A carregar...", back: "Voltar", search: "Pesquisar..." },
    splash: { tagline: "Horas, rendimentos e impostos num só lugar" },
    motivational: [
      "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
      "A sua única competição é quem você era ontem.",
      "Foco no progresso, não na perfeição.",
      "A disciplina é a ponte entre metas e realizações."
    ],
    landing: { 
      hero: "CONTROLO TOTAL DO SEU TEMPO E DINHEIRO.", 
      subhero: "A plataforma definitiva para profissionais que não aceitam perder um segundo de lucro.", 
      cta: "ATIVAR LICENÇA NEXUS", 
      login: "Entrar", 
      badge: "PLATAFORMA LÍDER 2025",
      painTitle: "O CAOS DA GESTÃO MANUAL",
      solutionTitle: "A PRECISÃO DIGITAL NEXUS",
      pains: [
        "Perda de rasto de horas extras trabalhadas.",
        "Dificuldade no cálculo de impostos e retenções.",
        "Falta de visão clara sobre o rendimento líquido real.",
        "Desorganização de documentos para contabilidade."
      ],
      solutions: [
        "Registo de horas com precisão de segundos.",
        "Cálculo automático de IRS, SS e IVA.",
        "Insights financeiros em tempo real.",
        "Exportação de relatórios prontos para o contabilista."
      ],
      advantages: [
        { title: "RELATÓRIOS PDF", desc: "Prontos a imprimir ou enviar." },
        { title: "NEXUS CLOUD", desc: "Dados seguros e sincronizados." },
        { title: "IA FINANCEIRA", desc: "Sugestões para aumentar o lucro." }
      ],
      features: "Recursos de Elite",
      featuresSubtitle: "Nexus Infrastructure",
      pricing: "INVESTIMENTO MÍNIMO, RETORNO MÁXIMO.",
      pricingBadge: "LANÇAMENTO",
      pricingPeriod: "/ Ano",
      pricingCta: "ATIVAR AGORA",
      pricingGuarantee: "GARANTIA DE SATISFAÇÃO NEXUS",
      testimonials: [
        {text: "A melhor ferramenta que já usei para faturar as minhas horas.", name: "Ricardo S.", role: "Consultor"},
        {text: "Recuperei 300€ em horas extras que esquecia de anotar.", name: "Ana F.", role: "Developer"}
      ],
      featuresItems: [
        { title: "Agenda Dinâmica", desc: "Registe entradas, saídas e pausas num calendário intuitivo." },
        { title: "Painel Fiscal", desc: "Saiba quanto vai pagar de impostos antes do fim do mês." },
        { title: "Portal Contabilista", desc: "Envie tudo o que o seu contabilista precisa num clique." },
        { title: "Multi-Moeda", desc: "Trabalhe em qualquer parte do mundo com conversão automática." },
        { title: "Segurança Bancária", desc: "Seus dados protegidos por criptografia de ponta." },
        { title: "Suporte VIP", desc: "Apoio total da equipa Digital Nexus Solutions." }
      ]
    },
    subscription: {
      title: "Assinatura NexusTime",
      createIdentity: "Crie a sua Conta Nexus",
      registerDesc: "Acesse a infraestrutura completa de gestão.",
      nexusIdEmail: "E-mail Principal",
      specialOffer: "Oferta Ativa",
      digitalLaunch: "Nexus Launch",
      save50: "50% OFF",
      annualSub: "Plano Anual",
      securePayment: "Pagamento Seguro",
      fullName: "Nome Completo",
      phone: "Telemóvel",
      password: "Senha de Acesso",
      confirm: "Confirmar Senha",
      payBtn: "Ativar Licença Agora",
      back: "Voltar",
      vendorCode: "Código de Parceiro",
      vendorApplied: "Desconto Aplicado"
    },
    greeting: { morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite" },
    tabs: { 
      admin: "Gestão Master", 
      dashboard: "Registro de dia", 
      finance: "Finanças", 
      reports: "Relatórios", 
      accountant: "Contabilista", 
      settings: "Perfil", 
      logout: "Sair", 
      regional: "Regional" 
    },
    dashboard: { 
      license: "LICENÇA", 
      daysLeft: "dias", 
      save: "GUARDAR DIA", 
      entry: "Entrada", 
      exit: "Saída", 
      absence: "Falta", 
      lunch: "Almoço", 
      advance: "Vale/Adiantamento", 
      location: "Localização", 
      notes: "Notas Adicionais", 
      extra: "Horas Extras", 
      extra_h1: "1° Hora Extra", 
      extra_h2: "2° Hora Extra", 
      extra_h3: "3° Hora Extra" 
    },
    finance: { title: "Resumo Financeiro", gross: "Total Bruto", net: "Total Líquido", taxes: "Impostos Retidos", advances: "Vales", hours: "Horas Totais", extraValue: "Valor Extras", generate: "Gerar IA", aiTitle: "Nexus Intelligence", aiHint: "Análise baseada no seu desempenho." },
    reports: { title: "Relatórios de Atividade", subtitle: "Histórico consolidado.", details: "Ver Detalhes", days: "dias trabalhados", noData: "Sem registos este mês", cloudArchive: "Arquivo Nexus Cloud", dateHeader: "Data", pause: "Almoço" },
    settings: { 
      title: "PERFIL", subtitle: "Dados profissionais e fiscais.", saveBtn: "Atualizar Perfil", 
      idAndContact: "DADOS PESSOAIS", irs: "Taxa IRS/Imposto", socialSecurity: "Segurança Social", vatPercentage: "Taxa IVA", 
      hourlyRateLabel: "Valor à Hora", defaultEntry: "Entrada Padrão", defaultExit: "Saída Padrão", 
      displayName: "Nome Completo", taxId: "NIF / ID Fiscal", phone: "Telemóvel", 
      ivaRegimeTitle: "Modo Freelancer (IVA)", ivaRegimeDesc: "Para trabalhadores independentes.", 
      overtimeBonus: "BÓNUS EXTRAS (%)", taxRetentionConfig: "RETENÇÕES FISCAIS", 
      freelancerNote: "Em modo freelancer, as taxas de SS e IRS manuais são prioritárias.", 
      standardHours: "HORÁRIO BASE", memberTitle: "MEMBRO DIGITAL NEXUS",
      security: { title: "Segurança", subtitle: "Gestão de credenciais.", minChars: "(mín. 6)", newPassword: "Nova Senha", confirmPassword: "Confirmar", updateBtn: "Mudar Senha" }
    },
    accountant: { title: "Relatório de Contabilidade", subtitle: "Documentos prontos para submissão.", annual: "Anual", quarterly: "Trimestral", print: "Imprimir PDF", declarationTitle: "Declaração Consolidada", contractRegime: "Regime de Contrato", freelancerRegime: "Prestação de Serviços", nif: "NIF", totals: "Totais do Período", month: "Mês" },
    login: { secureAccess: "Login Seguro", idNexus: "ID Nexus / Email", securityKey: "Palavra-passe", validateAccess: "Entrar no App", quickLogin: "Acesso Rápido", admin: "Admin", user: "Membro" }
  },
  'en': {
    common: { save: "Save", cancel: "Cancel", close: "Close", loading: "Loading...", back: "Back", search: "Search..." },
    splash: { tagline: "Hours, earnings, and taxes in one place" },
    motivational: sharedMotivational,
    tabs: { 
      admin: "Admin", 
      dashboard: "Daily Log", 
      finance: "Finance", 
      reports: "Reports", 
      settings: "Profile", 
      logout: "Logout" 
    },
    landing: { 
      hero: "TAKE FULL CONTROL OF YOUR TIME AND MONEY.", 
      subhero: "The ultimate platform for professionals who refuse to lose a second of profit.", 
      cta: "ACTIVATE NEXUS LICENSE", 
      login: "Login", 
      badge: "LEADING PLATFORM 2025",
      painTitle: "THE CHAOS OF MANUAL MANAGEMENT",
      solutionTitle: "THE DIGITAL NEXUS PRECISION",
      pains: [
        "Loss of overtime hours tracking.",
        "Difficulty calculating taxes and withholdings.",
        "Lack of clear vision on real net income.",
        "Disorganization of documents for accounting."
      ],
      solutions: [
        "Hours tracking with precision.",
        "Automatic calculation of IT, SS, and VAT.",
        "Real-time financial insights.",
        "Report exports ready for the accountant."
      ],
      advantages: [
        { title: "PDF REPORTS", desc: "Ready to print or send." },
        { title: "NEXUS CLOUD", desc: "Secure and synced data." },
        { title: "FINANCIAL AI", desc: "Suggestions to increase profit." }
      ],
      features: "Elite Features",
      featuresSubtitle: "Nexus Infrastructure",
      pricing: "MINIMUM INVESTMENT, MAXIMUM RETURN.",
      pricingBadge: "LAUNCH",
      pricingPeriod: "/ Year",
      pricingCta: "ACTIVATE NOW",
      pricingGuarantee: "NEXUS SATISFACTION GUARANTEE",
      testimonials: [
        {text: "The best tool I've ever used to bill my hours.", name: "Richard S.", role: "Consultant"},
        {text: "I recovered $300 in overtime I used to forget to write down.", name: "Ana F.", role: "Developer"}
      ],
      featuresItems: [
        { title: "Dynamic Schedule", desc: "Log entries, exits, and breaks in an intuitive calendar." },
        { title: "Tax Dashboard", desc: "Know how much you'll pay in taxes before the month ends." },
        { title: "Accountant Portal", desc: "Send everything your accountant needs in one click." },
        { title: "Multi-Currency", desc: "Work anywhere in the world with automatic conversion." },
        { title: "Bank-Level Security", desc: "Your data protected by state-of-the-art encryption." },
        { title: "VIP Support", desc: "Full support from the Digital Nexus Solutions team." }
      ]
    }
  }
};

// Inheritance logic for variants
if (translations['pt-PT']) {
  translations['pt-BR'] = { ...translations['pt-PT'], 
    tabs: { ...translations['pt-PT'].tabs, dashboard: "Registro Diário" },
    settings: { ...translations['pt-PT'].settings, irs: "IRPF", socialSecurity: "INSS" } 
  };
}
