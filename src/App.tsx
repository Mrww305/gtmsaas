import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Brain, Workflow, Zap, ArrowRight, Check, ChevronDown,
  Sparkles, Shield, Users, BarChart3, Globe, Layers, Play,
  Menu, X, Mail, Linkedin, MessageSquare, Target
} from 'lucide-react';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">RevFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#pillars" className="text-sm text-slate-300 hover:text-white transition">Platform</a>
          <a href="#icp" className="text-sm text-slate-300 hover:text-white transition">Who It's For</a>
          <a href="#pricing" className="text-sm text-slate-300 hover:text-white transition">Pricing</a>
          <a href="#why" className="text-sm text-slate-300 hover:text-white transition">Why RevFlow</a>
          <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
            Join Waitlist
          </button>
        </div>
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex flex-col gap-4"
          >
            <a href="#pillars" className="text-sm text-slate-300">Platform</a>
            <a href="#icp" className="text-sm text-slate-300">Who It's For</a>
            <a href="#pricing" className="text-sm text-slate-300">Pricing</a>
            <a href="#why" className="text-sm text-slate-300">Why RevFlow</a>
            <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-medium rounded-lg">
              Join Waitlist
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Now in Private Beta — Limited Spots Available</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
        >
          The Visual Canvas for{' '}
          <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Revenue Operations
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Connect signals, enrich data, generate AI outreach, and execute — all in one visual workflow. 
          BYO API keys. Pre-built templates. No GTM engineer required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="group px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium rounded-xl hover:opacity-90 transition flex items-center gap-2">
            Start Building Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition flex items-center gap-2">
            <Play className="w-4 h-4" />
            Watch Demo
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 flex items-center justify-center gap-8 flex-wrap"
        >
          {['Salesforce', 'HubSpot', 'Snowflake', 'Clearbit', 'OpenAI'].map((name) => (
            <span key={name} className="text-sm text-slate-500 font-medium">{name}</span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-5 h-5 text-slate-500 animate-bounce" />
      </motion.div>
    </section>
  );
}

function Pillars() {
  const pillars = [
    {
      icon: Database,
      title: 'Data',
      subtitle: 'Ingestion & Resolution',
      description: 'Visual webhook catchers, CSV import, and BYO API keys for Apollo, Clearbit, and ScrapingBee. Domain-based dedup + enrichment waterfall routing.',
      features: ['Visual webhook catchers', 'BYO API keys (Apollo, Clearbit)', 'Domain identity resolution', 'Enrichment waterfall routing'],
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: Brain,
      title: 'AI',
      subtitle: 'Context & Generation',
      description: 'Pre-prompted nodes like "Company Summary" and "Pain Point Extractor." BYO LLM keys for OpenAI/Anthropic. Dynamic fallback prompts.',
      features: ['Pre-prompted AI nodes', 'BYO LLM keys (OpenAI, Claude)', 'Dynamic fallback prompts', 'Multi-model routing'],
      color: 'from-violet-500 to-purple-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20'
    },
    {
      icon: Workflow,
      title: 'Orchestration',
      subtitle: 'Visual Canvas (React Flow)',
      description: 'Drag-and-drop node graph with IF/THEN branches, filters, splits, and delays. 10 out-of-the-box revenue plays ready to launch.',
      features: ['React Flow visual canvas', 'IF/THEN + Filter + Split nodes', '10 revenue play templates', 'A/B testing path branches'],
      color: 'from-emerald-500 to-teal-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      icon: Zap,
      title: 'Execution & Sync',
      subtitle: 'Safe Delivery Layer',
      description: 'Smartlead/Instantly webhook push for warmed-up outreach. HubSpot/Pipedrive sync. Slack alerts. Full execution analytics & cost tracking.',
      features: ['Smartlead/Instantly push', 'HubSpot & Pipedrive sync', 'Slack/Discord alerts', 'Run logs & API cost counters'],
      color: 'from-orange-500 to-amber-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  return (
    <section id="pillars" className="relative py-32 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">The Platform</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">The 4 Pillars of Modern GTM</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every feature is built around four interconnected building blocks that work together as a unified system.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative group p-8 rounded-2xl border ${pillar.borderColor} ${pillar.bgColor} hover:bg-opacity-20 transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-5`}>
                <pillar.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{pillar.title}</h3>
              <p className="text-sm text-slate-400 mb-3">{pillar.subtitle}</p>
              <p className="text-slate-300 mb-5 leading-relaxed">{pillar.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {pillar.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CanvasPreview() {
  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">The De-Risked Canvas</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">See It In Action</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A real workflow: LinkedIn job change signal → enrich → AI-personalize → send via Smartlead → log to HubSpot.
          </p>
        </motion.div>

        {/* Canvas Mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-violet-500/5"
        >
          {/* Canvas toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-sm text-slate-400 font-mono">The Job Change Pounce — v2.3</span>
              <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-300 rounded-full">🔄 Versioned</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-medium">🧪 Dry Run Mode</span>
              </div>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">● Live</span>
              <span className="text-xs text-slate-500">1,247 runs</span>
            </div>
          </div>

          {/* Cost estimator bar */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">Estimated cost: <span className="text-cyan-300 font-medium">$0.023/run</span></span>
              <span className="text-slate-400">This test: <span className="text-cyan-300 font-medium">$0.46</span> (20 leads)</span>
              <span className="text-slate-400">Usage: <span className="text-emerald-300 font-medium">4,231/10,000</span> enrichments</span>
            </div>
            <span className="text-xs text-slate-500">Rate limit: 87/100 req/min</span>
          </div>

          {/* Canvas area */}
          <div className="relative p-8 min-h-[420px] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]">
            {/* SVG connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {/* Trigger → Enrich */}
              <path d="M 180 80 C 240 80, 240 80, 300 80" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              {/* Enrich → AI */}
              <path d="M 460 80 C 520 80, 520 80, 580 80" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              {/* AI → IF/THEN */}
              <path d="M 740 80 C 800 80, 800 80, 860 80" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              {/* IF/THEN → Smartlead (top branch) */}
              <path d="M 940 60 C 1000 60, 1000 60, 1060 60" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              {/* IF/THEN → Slack (bottom branch) */}
              <path d="M 940 120 C 1000 120, 1000 200, 1060 200" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              {/* Smartlead → HubSpot */}
              <path d="M 1220 60 C 1280 60, 1280 60, 1340 60" stroke="url(#lineGrad)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
            </svg>

            {/* Nodes */}
            <div className="relative z-10 flex flex-wrap gap-6 items-start">
              {/* Trigger node */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-blue-500/30 flex items-center justify-center">
                      <Globe className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <span className="text-xs text-blue-300 font-medium">TRIGGER</span>
                  </div>
                  <p className="text-sm text-white font-medium">LinkedIn Signal</p>
                  <p className="text-xs text-slate-400 mt-1">Job change detected</p>
                </div>
              </div>

              {/* Enrich node */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-cyan-500/30 flex items-center justify-center">
                      <Database className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span className="text-xs text-cyan-300 font-medium">ENRICH</span>
                  </div>
                  <p className="text-sm text-white font-medium">Apollo → Clearbit</p>
                  <p className="text-xs text-slate-400 mt-1">Waterfall fallback</p>
                </div>
              </div>

              {/* AI node */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-violet-500/30 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-violet-300" />
                    </div>
                    <span className="text-xs text-violet-300 font-medium">AI NODE</span>
                  </div>
                  <p className="text-sm text-white font-medium">Pain Point Extract</p>
                  <p className="text-xs text-slate-400 mt-1">BYO OpenAI key</p>
                </div>
              </div>

              {/* IF/THEN node */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-amber-500/30 flex items-center justify-center">
                      <Workflow className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <span className="text-xs text-amber-300 font-medium">CONDITION</span>
                  </div>
                  <p className="text-sm text-white font-medium">ICP Score ≥ B</p>
                  <p className="text-xs text-slate-400 mt-1">Split: Yes / No</p>
                </div>
              </div>
            </div>

            {/* Second row */}
            <div className="relative z-10 flex flex-wrap gap-6 items-start mt-16 ml-[880px]">
              {/* Smartlead */}
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-emerald-500/30 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <span className="text-xs text-emerald-300 font-medium">EXECUTE</span>
                </div>
                <p className="text-sm text-white font-medium">Smartlead Push</p>
                <p className="text-xs text-slate-400 mt-1">Warmed inbox</p>
              </div>

              {/* HubSpot */}
              <div className="px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-orange-500/30 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-orange-300" />
                  </div>
                  <span className="text-xs text-orange-300 font-medium">SYNC</span>
                </div>
                <p className="text-sm text-white font-medium">HubSpot Log</p>
                <p className="text-xs text-slate-400 mt-1">Create activity</p>
              </div>
            </div>

            {/* Slack alert (bottom branch) */}
            <div className="relative z-10 mt-8 ml-[880px]">
              <div className="px-4 py-3 rounded-xl bg-pink-500/10 border border-pink-500/30 min-w-[140px] inline-block">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-pink-500/30 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-pink-300" />
                  </div>
                  <span className="text-xs text-pink-300 font-medium">ALERT</span>
                </div>
                <p className="text-sm text-white font-medium">Slack #hot-leads</p>
                <p className="text-xs text-slate-400 mt-1">If score = A</p>
              </div>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="grid grid-cols-4 border-t border-white/5 bg-slate-900/50">
            {[
              { label: 'Runs (7d)', value: '1,247', color: 'text-emerald-400' },
              { label: 'API Cost', value: '$12.40', color: 'text-cyan-400' },
              { label: 'Success Rate', value: '98.2%', color: 'text-violet-400' },
              { label: 'Avg. Duration', value: '3.2s', color: 'text-amber-400' }
            ].map((stat) => (
              <div key={stat.label} className="p-4 border-r border-white/5 last:border-r-0">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Error handling panel */}
          <div className="border-t border-white/5 bg-slate-900/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Errors (Auto-Handled)</span>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-300 rounded-full">3 recovered</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-red-300 font-medium">Apollo Rate Limit</span>
                </div>
                <p className="text-xs text-slate-400">Auto-retried in 30s → Fallback to Clearbit ✓</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-amber-300 font-medium">OpenAI Empty Output</span>
                </div>
                <p className="text-xs text-slate-400">Retry #2 succeeded with schema enforcement ✓</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-blue-300 font-medium">HubSpot Sync Delay</span>
                </div>
                <p className="text-xs text-slate-400">Queued in DLQ → Processed in 2.1s ✓</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User trust features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 grid md:grid-cols-3 gap-4"
        >
          <div className="p-5 rounded-xl bg-slate-800/30 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📤</span>
              <span className="text-sm font-bold text-white">One-Click Data Export</span>
            </div>
            <p className="text-xs text-slate-400">Export all enriched data as CSV/JSON. You own your data — always.</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-800/30 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📜</span>
              <span className="text-sm font-bold text-white">Full Audit Log</span>
            </div>
            <p className="text-xs text-slate-400">Track every workflow run, every change, every error. Debug in seconds.</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-800/30 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔄</span>
              <span className="text-sm font-bold text-white">Workflow Versioning</span>
            </div>
            <p className="text-xs text-slate-400">Auto-save every change. Roll back to any previous version in one click.</p>
          </div>
        </motion.div>

        {/* Template callouts */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          {[
            { name: 'The Job Change Pounce', icon: '🎯', desc: 'Detect new VPs → enrich → personalized congrats email' },
            { name: 'The G2 Review Reactor', icon: '⭐', desc: 'Monitor competitor reviews → route detractors to win-back' },
            { name: 'The Funding Follower', icon: '💰', desc: 'Crunchbase signal → enrich team → multi-touch sequence' },
            { name: 'The Website Ghost', icon: '👻', desc: 'Clearbit reverse lookup → identify visitors → re-engage' }
          ].map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-violet-500/20 transition-all cursor-pointer"
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <p className="text-sm font-bold text-white">{t.name}</p>
              <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ICPSection() {
  const icps = [
    {
      icon: Target,
      title: 'RevOps Leaders',
      description: 'VP/Director of Revenue Operations at mid-market and enterprise companies ($50M–$500M ARR) managing complex tech stacks.',
      painPoints: ['Fragmented data across 12+ tools', 'Manual reporting & forecasting', 'Poor lead routing & SLA compliance'],
      persona: 'Sarah, VP RevOps @ Series C SaaS'
    },
    {
      icon: Users,
      title: 'Growth Marketers',
      description: 'Head of Growth or Demand Gen at B2B companies running multi-channel campaigns with limited engineering support.',
      painPoints: ['Can\'t orchestrate across channels', 'Attribution is a black box', 'Campaign execution takes weeks'],
      persona: 'Marcus, Head of Growth @ B2B Fintech'
    },
    {
      icon: Layers,
      title: 'GTM Engineers',
      description: 'Technical operators building the systems that connect sales, marketing, and CS — the architects of revenue infrastructure.',
      painPoints: ['Zapier/Make can\'t handle complexity', 'No version control for workflows', 'Constant context-switching between tools'],
      persona: 'Alex, GTM Engineer @ PLG Startup'
    }
  ];

  return (
    <section id="icp" className="relative py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Who It's For</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">Built for the Modern Revenue Team</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Three distinct buyer personas who feel the pain of fragmented GTM stacks every single day.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {icps.map((icp, i) => (
            <motion.div
              key={icp.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-5">
                <icp.icon className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{icp.title}</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">{icp.description}</p>
              
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Top Pain Points</p>
                {icp.painPoints.map((p) => (
                  <div key={p} className="flex items-start gap-2 text-sm text-slate-300 mb-2">
                    <span className="text-red-400 mt-0.5">●</span>
                    {p}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500">Persona:</p>
                <p className="text-sm text-slate-300 font-medium">{icp.persona}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemsSection() {
  const problems = [
    {
      number: '01',
      title: 'Enrichment Cost Spiral',
      legacy: 'Pay per-lookup pricing that scales against you. 10K enrichments = $500/mo in API costs eating your margins.',
      solution: 'BYO API keys + enrichment waterfall routing. Use your own Apollo/Clearbit credentials. Fallback cascades ensure no lead falls through.'
    },
    {
      number: '02',
      title: 'Execution Complexity',
      legacy: 'Building a multi-channel campaign takes 2 weeks, 3 tools, and a GTM engineer who can write Zapier formulas.',
      solution: 'Visual canvas with pre-built templates. "The Job Change Pounce" goes from idea to live in 7 minutes. No code required.'
    },
    {
      number: '03',
      title: 'AI Without Guardrails',
      legacy: 'Raw GPT access dumps prompt engineering on users. Rate limits break workflows. No fallback means dead ends.',
      solution: 'Pre-prompted nodes + BYO LLM keys + dynamic fallback prompts. Multi-model routing (Claude for reasoning, GPT-4o-mini for speed).'
    }
  ];

  return (
    <section className="relative py-32 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Why RevFlow Wins</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">3 Problems We Solve Better</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Compared to legacy CRMs and disjointed point solutions, RevFlow eliminates the gaps that kill revenue.
          </p>
        </motion.div>

        <div className="space-y-8">
          {problems.map((p, i) => (
            <motion.div
              key={p.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/5"
            >
              <div className="flex items-start gap-6">
                <span className="text-3xl font-bold bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">{p.number}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">{p.title}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-xs font-medium text-red-400 uppercase mb-1">Legacy Approach</p>
                      <p className="text-sm text-slate-300">{p.legacy}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs font-medium text-emerald-400 uppercase mb-1">RevFlow Way</p>
                      <p className="text-sm text-slate-300">{p.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const stack = [
    { category: 'Frontend', items: ['React + TypeScript', 'React Flow (canvas)', 'Tailwind CSS', 'Framer Motion'] },
    { category: 'Backend', items: ['Node.js / Fastify', 'Temporal (workflows)', 'BullMQ (job queues)', 'Webhook relay layer'] },
    { category: 'Database', items: ['PostgreSQL (primary)', 'Redis (caching/queues)', 'S3 (file storage)', 'ClickHouse (analytics)'] },
    { category: 'Infrastructure', items: ['AWS (ECS + RDS)', 'CloudFront CDN', 'Vercel (frontend)', 'Sentry (monitoring)'] },
    { category: 'Observability', items: ['Datadog (metrics)', 'PostHog (product analytics)', 'Sentry (errors)', 'PagerDuty (alerting)'] },
    { category: 'Metering & Billing', items: ['Stripe (payments)', 'Custom usage meter', 'Per-user rate limits', 'Cost attribution'] }
  ];

  const integrations = [
    { name: 'Apollo', type: 'Enrichment', status: 'MVP' },
    { name: 'Clearbit', type: 'Enrichment', status: 'MVP' },
    { name: 'OpenAI', type: 'AI', status: 'MVP' },
    { name: 'Anthropic', type: 'AI', status: 'MVP' },
    { name: 'Smartlead', type: 'Email', status: 'MVP' },
    { name: 'Instantly', type: 'Email', status: 'MVP' },
    { name: 'HubSpot', type: 'CRM', status: 'MVP' },
    { name: 'Pipedrive', type: 'CRM', status: 'MVP' },
    { name: 'Slack', type: 'Alerts', status: 'MVP' },
    { name: 'Salesforce', type: 'CRM', status: 'Q2' },
    { name: 'ScrapingBee', type: 'Scraping', status: 'MVP' },
    { name: 'Crunchbase', type: 'Signals', status: 'Q2' }
  ];

  return (
    <section className="relative py-32 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Enterprise-Grade Infrastructure</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">Built on Modern Infrastructure</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Enterprise-grade stack with SOC2 path, GDPR compliance, and 99.9% uptime SLA.
          </p>
        </motion.div>

        {/* Tech stack grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {stack.map((cat, i) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-slate-800/30 border border-white/5"
            >
              <h4 className="text-sm font-bold text-violet-300 uppercase tracking-wider mb-4">{cat.category}</h4>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integrations table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">Integration Ecosystem</h4>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                MVP (Day 1)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Q2 Roadmap
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {integrations.map((int, i) => (
              <div key={int.name} className={`p-4 border-b border-r border-white/5 ${i % 6 === 5 ? 'border-r-0' : ''}`}>
                <p className="text-sm font-medium text-white">{int.name}</p>
                <p className="text-xs text-slate-500">{int.type}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                  int.status === 'MVP' 
                    ? 'bg-emerald-500/10 text-emerald-300' 
                    : 'bg-amber-500/10 text-amber-300'
                }`}>
                  {int.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Compliance badges */}
        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
          {[
            { label: 'SOC2 Type II', icon: Shield },
            { label: 'GDPR Compliant', icon: Globe },
            { label: '99.9% Uptime SLA', icon: BarChart3 },
            { label: 'End-to-End Encryption', icon: Layers }
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <badge.icon className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductionReadiness() {
  const safeguards = [
    {
      icon: '🚀',
      title: 'Quick Start Wizard',
      description: 'Pick a template → connect 1 source → run your first 10 leads in 4 minutes. Zero config required.',
      priority: 'P0'
    },
    {
      icon: '💰',
      title: 'Usage Metering',
      description: 'Real-time tracking of API calls, workflow executions, and records stored. Hard caps at tier limits.',
      priority: 'P0'
    },
    {
      icon: '🧪',
      title: 'Dry Run Mode',
      description: 'Test workflows without sending emails or burning credits. See estimated cost before executing.',
      priority: 'P1'
    },
    {
      icon: '⚠️',
      title: 'Error Handling UX',
      description: 'Visual error states, retry options, and clear explanations. Users never feel lost when things fail.',
      priority: 'P1'
    },
    {
      icon: '📤',
      title: 'Data Export',
      description: 'CSV/JSON export from any workflow run. Users own their data and can leave anytime.',
      priority: 'P2'
    },
    {
      icon: '📜',
      title: 'Audit Log',
      description: 'Track who ran what, when, and with what results. Essential for debugging and compliance.',
      priority: 'P2'
    },
    {
      icon: '🔄',
      title: 'Workflow Versioning',
      description: 'Auto-save versions with rollback capability. Edit live workflows without fear.',
      priority: 'P2'
    },
    {
      icon: '🗑️',
      title: 'GDPR Deletion',
      description: 'One-click account deletion with cascading data removal. Required for EU customers.',
      priority: 'P2'
    }
  ];

  return (
    <section className="relative py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Production-Ready from Day 1</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">Built to Scale, Not Break</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every safeguard you need to run mission-critical revenue operations — without the enterprise complexity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {safeguards.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-xl bg-slate-800/30 border border-white/5 hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{item.icon}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  item.priority === 'P0' ? 'bg-red-500/10 text-red-300' :
                  item.priority === 'P1' ? 'bg-amber-500/10 text-amber-300' :
                  'bg-slate-500/10 text-slate-300'
                }`}>
                  {item.priority}
                </span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Solo founder callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">👨‍💻</div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Solo Founder Optimized</h4>
              <p className="text-slate-300 leading-relaxed">
                Built by a solo technical founder who knows the constraints. Every feature is designed to minimize support tickets, 
                maximize self-service, and keep operational overhead low. You get enterprise-grade reliability without the enterprise-grade complexity.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ActivationFlow() {
  const steps = [
    { step: 1, title: 'Pick Your Play', description: 'Choose from 4 flagship templates or start blank', time: '30 sec' },
    { step: 2, title: 'Connect Data Source', description: 'Webhook, CSV, or LinkedIn Signal Harvester', time: '1 min' },
    { step: 3, title: 'Add Enrichment', description: 'BYO Apollo/Clearbit key or use ours', time: '30 sec' },
    { step: 4, title: 'Configure AI', description: 'BYO OpenAI key or use pre-prompted nodes', time: '1 min' },
    { step: 5, title: 'Connect Execution', description: 'Smartlead, Instantly, or Slack alerts', time: '1 min' },
    { step: 6, title: 'Test & Launch', description: 'Dry run first, then execute live', time: '30 sec' }
  ];

  return (
    <section className="relative py-32 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">Activation Flow</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">From Signup to First Lead in 4 Minutes</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No complex setup. No engineering required. Just pick a template, connect your tools, and run.
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-cyan-500 hidden md:block" />

          <div className="space-y-6">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex items-start gap-6"
              >
                <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/20">
                  {item.step}
                </div>
                <div className="flex-1 p-6 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-white">{item.title}</h4>
                    <span className="text-xs text-slate-500 font-medium">{item.time}</span>
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Total time: 4 minutes 30 seconds</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const tiers = [
    {
      name: 'Starter',
      price: '$249',
      period: '/mo',
      description: 'For small GTM teams getting started with orchestration.',
      features: ['Up to 5 seats', '10K records enriched/mo', '3 active workflows', 'Email + LinkedIn channels', 'Basic AI scoring', 'Usage metering dashboard', 'Dry run mode', 'Community support'],
      cta: 'Start 12-Day Free Trial',
      popular: false
    },
    {
      name: 'Growth',
      price: '$749',
      period: '/mo',
      description: 'For scaling teams that need full-stack GTM automation.',
      features: ['Up to 25 seats', '100K records enriched/mo', 'Unlimited workflows', 'All channels + ads', 'Advanced AI agents', 'Cost attribution per workflow', 'Audit log & versioning', 'Priority support + CSM'],
      cta: 'Start 12-Day Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with complex compliance and scale needs.',
      features: ['Unlimited seats', 'Unlimited enrichment', 'Dedicated infrastructure', 'SSO + SCIM', 'SOC2 + HIPAA', 'Custom rate limits', 'Dedicated solutions engineer', 'SLA guarantees'],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="relative py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">Transparent, Usage-Based Pricing</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Start with a <span className="text-white font-medium">12-day free trial</span> — no credit card required. Real-time metering dashboard. Hard caps at tier limits. No surprise bills.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl border transition-all ${
                tier.popular
                  ? 'bg-gradient-to-b from-violet-500/10 to-cyan-500/5 border-violet-500/30 scale-105'
                  : 'bg-slate-800/30 border-white/5 hover:border-white/10'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-medium rounded-full">
                  Most Popular • 12 Days Free
                </div>
              )}
              {!tier.popular && tier.name !== 'Enterprise' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-full">
                  12 Days Free
                </div>
              )}
              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-slate-400">{tier.period}</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">{tier.description}</p>
              <button className={`w-full py-3 rounded-xl font-medium text-sm transition ${
                tier.popular
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}>
                {tier.cta}
              </button>
              <div className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyRevFlow() {
  const comparisons = [
    {
      category: 'vs. Clay',
      icon: '🧩',
      points: [
        { clay: 'Spreadsheet-first — requires data engineering skills', revflow: 'Visual canvas — anyone can build workflows' },
        { clay: 'No native execution — export to send', revflow: 'Execute directly via Smartlead/Instantly' },
        { clay: 'Complex prompt engineering for AI', revflow: 'Pre-prompted nodes — zero prompt knowledge needed' }
      ]
    },
    {
      category: 'vs. Zapier / Make',
      icon: '⚡',
      points: [
        { clay: 'Generic automation — not built for revenue', revflow: 'Purpose-built for GTM workflows' },
        { clay: 'No enrichment or AI built-in', revflow: 'Native enrichment waterfall + AI agents' },
        { clay: 'Breaks at scale with complex logic', revflow: 'BullMQ queues handle 100K+ runs/day' }
      ]
    },
    {
      category: 'vs. Running 12 Separate Tools',
      icon: '🔧',
      points: [
        { clay: '$2,000+/mo across enrichment, AI, email, CRM', revflow: '$499/mo — one platform, one bill' },
        { clay: 'Data silos, manual CSV exports, sync breaks', revflow: 'Unified data layer with bi-directional sync' },
        { clay: 'Weeks to build a multi-channel campaign', revflow: '4 minutes with pre-built templates' }
      ]
    }
  ];

  const stats = [
    { value: '4 min', label: 'Time to first lead', sublabel: 'From signup to execution' },
    { value: '73%', label: 'Less tool spend', sublabel: 'vs. average GTM stack' },
    { value: '12→1', label: 'Tools consolidated', sublabel: 'Single source of truth' },
    { value: '98.2%', label: 'Workflow success rate', sublabel: 'With auto-recovery' }
  ];

  return (
    <section id="why" className="relative py-32 bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-rose-400 uppercase tracking-wider">Why RevFlow</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">Stop Juggling. Start Orchestrating.</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            See how RevFlow compares to the tools you're using today — and the fragmented stacks you're paying for.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="p-6 rounded-xl bg-slate-800/30 border border-white/5 text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm font-medium text-white mt-2">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.sublabel}</p>
            </div>
          ))}
        </motion.div>

        {/* Comparisons */}
        <div className="space-y-6">
          {comparisons.map((comp, i) => (
            <motion.div
              key={comp.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-slate-800/30 border border-white/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{comp.icon}</span>
                <h3 className="text-xl font-bold text-white">{comp.category}</h3>
              </div>
              <div className="space-y-3">
                {comp.points.map((point, j) => (
                  <div key={j} className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{point.clay}</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{point.revflow}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaitlistCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Unify Your GTM Stack?
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Join 500+ RevOps leaders on the waitlist. Get early access, exclusive content, and shape the product roadmap.
          </p>

          {!submitted ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
              <div className="relative flex-1 w-full">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition"
                />
              </div>
              <button
                onClick={() => { if (email) setSubmitted(true); }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium rounded-xl hover:opacity-90 transition whitespace-nowrap"
              >
                Join Waitlist
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-medium">You're on the list!</p>
              <p className="text-sm text-slate-400 mt-1">We'll reach out with early access details soon.</p>
            </motion.div>
          )}

          <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              SOC2 Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Globe className="w-4 h-4 text-emerald-400" />
              GDPR Ready
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Layers className="w-4 h-4 text-emerald-400" />
              50+ Integrations
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">RevFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition"><Mail className="w-5 h-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition"><MessageSquare className="w-5 h-5" /></a>
          </div>
          <p className="text-sm text-slate-500">© 2026 RevFlow. Building the future of GTM.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <Navbar />
      <Hero />
      <Pillars />
      <CanvasPreview />
      <ICPSection />
      <ProblemsSection />
      <TechStack />
      <ProductionReadiness />
      <ActivationFlow />
      <PricingSection />
      <WhyRevFlow />
      <WaitlistCTA />
      <Footer />
    </div>
  );
}
