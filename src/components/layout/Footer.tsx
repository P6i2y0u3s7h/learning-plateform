import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Radio, 
  BookOpen,
  Target,
  FileText,
  Award,
  ChevronRight,
  MessageSquare,
  Users,
  PlayCircle,
  ExternalLink,
  Zap,
  Globe2
} from 'lucide-react';
import brandLogo from '../../assets/brand-logo.jpg';
import { APP_CONFIG } from '../../constants/app';
import { ROUTES } from '../../constants/routes';

export const Footer: React.FC = () => {
  const [istTime, setIstTime] = useState<string>('');
  const [inquiryInput, setInquiryInput] = useState<string>('');
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);
  const [activeCampus, setActiveCampus] = useState<string>('Delhi');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        };
        setIstTime(new Intl.DateTimeFormat('en-GB', options).format(now) + ' IST');
      } catch {
        setIstTime('LIVE IST');
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryInput.trim()) return;
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setInquiryInput('');
    }, 4000);
  };

  const campuses = [
    { city: 'Delhi', location: 'Knowledge Park, Education Hub', status: 'Admissions Open', phone: '+91 98765 43210' },
    { city: 'Patna', location: 'Kankarbagh Main Rd, Patna Central', status: 'Offline Batches Active', phone: '+91 98765 43211' },
    { city: 'Aligarh', location: 'Dodhpur Market, Near AMU Circle', status: 'Test Series Center', phone: '+91 98765 43212' },
  ];

  return (
    <footer className="mt-auto relative overflow-hidden pt-14 text-white">
      {/* Dynamic Ambient Background Auroras */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[700px] h-[350px] bg-[#CCFF00]/15 blur-[160px] pointer-events-none rounded-full animate-aurora" />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 w-[700px] h-[350px] bg-[#38BDF8]/15 blur-[160px] pointer-events-none rounded-full animate-aurora" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[280px] bg-[#8B5CF6]/15 blur-[150px] pointer-events-none rounded-full" />

      {/* Main Elevated Glassmorphic Cockpit Stage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-stage rounded-t-[2.5rem] lg:rounded-t-[3.5rem] p-6 sm:p-10 lg:p-12 relative z-10 overflow-hidden border border-white/20">
          
          {/* Top Specular Horizon Light Beam */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent shadow-[0_0_20px_#CCFF00]" />
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-white shadow-[0_0_10px_#ffffff]" />

          {/* Top Architectural Telemetry & Live Status Strip */}
          <div className="pb-8 mb-10 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="glass-pill px-3 py-1.5 rounded-full font-mono text-[10px] text-emerald-400 flex items-center gap-2 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold tracking-wider">SYSTEM: 100% OPERATIONAL</span>
              </span>
              <span className="glass-pill px-3 py-1.5 rounded-full font-mono text-[10px] text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="font-bold text-white">{istTime || '12:00:00 IST'}</span>
              </span>
              <span className="glass-pill px-3 py-1.5 rounded-full font-mono text-[10px] text-slate-300 hidden sm:flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span>SERVER: ASIA-SOUTH1 // 18MS</span>
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase">
              <span className="text-[#CCFF00] font-black">ADMISSIONS 2026-27</span>
              <span className="text-slate-600">//</span>
              <span className="text-white font-medium">FOUNDATION & TARGET BATCHES</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* HIGH-STYLISH BENTO GRID ARCHITECTURE                     */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-12 border-b border-white/10">
            
            {/* 1. BRAND COMMAND COCKPIT (5 cols) */}
            <div className="lg:col-span-5 p-7 rounded-3xl glass-cockpit-interactive flex flex-col justify-between border border-white/15 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#CCFF00]/20 transition-all duration-700" />
              
              <div>
                {/* Brand Header */}
                <Link to={ROUTES.HOME} className="flex items-center gap-3.5 group/logo inline-flex mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-black border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-2xl group-hover/logo:border-[#CCFF00] group-hover/logo:shadow-[0_0_25px_rgba(204,255,0,0.4)] transition-all">
                    <img 
                      src={brandLogo} 
                      alt="Brainstorm Academy Logo" 
                      className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform" 
                    />
                  </div>
                  <div>
                    <span className="font-display font-black text-white text-2xl tracking-wider uppercase block">
                      BRAINSTORM <span className="text-[#CCFF00]">ACADEMY.</span>
                    </span>
                    <span className="font-mono text-[9px] text-[#38BDF8] tracking-[0.25em] uppercase block font-bold">
                      LEARN TODAY. LEAD TOMORROW.
                    </span>
                  </div>
                </Link>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans mb-6">
                  Premier digital and classroom preparation ecosystem powering aspirants across CBSE Boards (6th–12th), State Competitive Recruitments (BPSC TRE, Bihar SI, Super TET), and Central Universities (AMU & Jamia Millia Islamia).
                </p>

                {/* Instant Syllabus Blueprint Glass Capsule Form */}
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl mb-6 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-white font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
                      <span>GET 2026 EXAM BLUEPRINT</span>
                    </div>
                    <span className="font-mono text-[9px] text-[#CCFF00] tracking-wider uppercase">FREE PDF</span>
                  </div>
                  
                  {inquirySubmitted ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Request logged! Syllabus sent to your WhatsApp/Email.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inquiryInput}
                        onChange={(e) => setInquiryInput(e.target.value)}
                        placeholder="Enter phone or email..."
                        className="flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#CCFF00] transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#CCFF00] transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(204,255,0,0.5)] cursor-pointer flex-shrink-0"
                      >
                        <span>GET</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  )}
                </div>

                {/* Direct Connect Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <a
                    href={`tel:${APP_CONFIG.contact.phone}`}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#CCFF00]/50 hover:bg-white/[0.07] transition-all flex items-center gap-2 text-slate-300 hover:text-white group/btn"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
                      <Phone className="w-3 h-3" />
                    </div>
                    <span className="truncate">{APP_CONFIG.contact.phone}</span>
                  </a>

                  <a
                    href={`mailto:${APP_CONFIG.contact.email}`}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#38BDF8]/50 hover:bg-white/[0.07] transition-all flex items-center gap-2 text-slate-300 hover:text-white group/btn"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                      <Mail className="w-3 h-3" />
                    </div>
                    <span className="truncate">{APP_CONFIG.contact.email}</span>
                  </a>
                </div>
              </div>

              {/* Social Channels Community Glass Strip */}
              <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  COMMUNITY HUBS:
                </span>
                <div className="flex items-center gap-2">
                  <a 
                    href="https://t.me" 
                    target="_blank" 
                    rel="noreferrer"
                    className="glass-pill px-2.5 py-1 rounded-lg font-mono text-[10px] text-cyan-400 hover:border-cyan-400/50 flex items-center gap-1.5 transition-all"
                  >
                    <span>TELEGRAM</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                  <a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="glass-pill px-2.5 py-1 rounded-lg font-mono text-[10px] text-rose-400 hover:border-rose-400/50 flex items-center gap-1.5 transition-all"
                  >
                    <span>YOUTUBE</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                  <a 
                    href="https://whatsapp.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="glass-pill px-2.5 py-1 rounded-lg font-mono text-[10px] text-emerald-400 hover:border-emerald-400/50 flex items-center gap-1.5 transition-all"
                  >
                    <span>WHATSAPP</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 2. PROGRAMS ECOSYSTEM WIDGET (4 cols) */}
            <div className="lg:col-span-4 p-7 rounded-3xl glass-cockpit-interactive flex flex-col justify-between border border-white/15">
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#CCFF00] font-black tracking-widest">01 //</span>
                    <h3 className="font-mono font-bold text-white text-xs tracking-[0.18em] uppercase">
                      Curriculum Engines
                    </h3>
                  </div>
                  <span className="glass-pill px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 uppercase">
                    5 TRACKS
                  </span>
                </div>

                {/* Stylish Micro-Cards for Programs */}
                <div className="space-y-2.5">
                  {[
                    {
                      to: ROUTES.SCHOOL_COURSES,
                      icon: BookOpen,
                      title: 'School Courses (6th-12th)',
                      tag: 'CBSE & STATE',
                      color: 'text-[#CCFF00]',
                      borderHover: 'hover:border-[#CCFF00]/40',
                    },
                    {
                      to: ROUTES.COMPETITIVE_EXAMS,
                      icon: Target,
                      title: 'Competitive Examinations',
                      tag: 'BPSC TRE • SI',
                      color: 'text-[#38BDF8]',
                      borderHover: 'hover:border-[#38BDF8]/40',
                    },
                    {
                      to: ROUTES.AMU_JAMIA,
                      icon: GraduationCap,
                      title: 'AMU & Jamia Millia Entrances',
                      tag: 'CLASS 9/11/DIPLOMA',
                      color: 'text-[#A855F7]',
                      borderHover: 'hover:border-[#A855F7]/40',
                    },
                    {
                      to: ROUTES.STUDY_MATERIALS,
                      icon: FileText,
                      title: 'Digital Notes & PYQ Vault',
                      tag: 'SMART PDFS',
                      color: 'text-amber-400',
                      borderHover: 'hover:border-amber-400/40',
                    },
                    {
                      to: ROUTES.MOCK_TESTS,
                      icon: Award,
                      title: 'CBT Proctored Mock Series',
                      tag: 'ALL INDIA RANK',
                      color: 'text-emerald-400',
                      borderHover: 'hover:border-emerald-400/40',
                    },
                  ].map((prog, idx) => (
                    <Link
                      key={idx}
                      to={prog.to}
                      className={`p-3 rounded-2xl bg-white/[0.02] border border-white/8 ${prog.borderHover} hover:bg-white/[0.06] transition-all flex items-center justify-between group cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${prog.color} group-hover:scale-105 transition-transform`}>
                          <prog.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-sans font-bold text-xs text-white group-hover:text-white transition-colors">
                            {prog.title}
                          </h4>
                          <span className="font-mono text-[9px] text-slate-400 block tracking-wider">
                            {prog.tag}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>✦ NCERT & NTA STANDARDS</span>
                <span className="text-[#CCFF00]">BILINGUAL HINDI/ENG</span>
              </div>
            </div>

            {/* 3. FOUNDATION BOARDS & DUAL PORTALS (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Foundation Grades Grid Card */}
              <div className="p-6 rounded-3xl glass-cockpit-interactive border border-white/15">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#38BDF8] font-black">02 //</span>
                    <h3 className="font-mono font-bold text-white text-xs tracking-[0.16em] uppercase">
                      Boards Prep
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-[#38BDF8] font-bold">2026-27</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { grade: 'Class 9', label: 'Foundation' },
                    { grade: 'Class 10', label: 'Board Target' },
                    { grade: 'Class 11', label: 'Science/Arts' },
                    { grade: 'Class 12', label: 'Final Sprint' },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      to={ROUTES.CLASS_PAGE(`class-${item.grade.split(' ')[1]}`)}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#38BDF8]/60 hover:bg-white/[0.08] transition-all text-center group"
                    >
                      <span className="font-mono font-bold text-xs text-white block group-hover:text-[#38BDF8]">
                        {item.grade}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 block tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>

                <Link
                  to={ROUTES.SCHOOL_COURSES}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <span>Explore Grades 6-12</span>
                  <ArrowUpRight className="w-3 h-3 text-[#38BDF8]" />
                </Link>
              </div>

              {/* Ecosystem Portals Launcher Card */}
              <div className="p-6 rounded-3xl glass-cockpit-interactive border border-white/15">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#A855F7] font-black">03 //</span>
                    <h3 className="font-mono font-bold text-white text-xs tracking-[0.16em] uppercase">
                      Portals
                    </h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <Link
                    to={ROUTES.STUDENT.ROOT}
                    className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold block">
                        ASPIRANT COCKPIT
                      </span>
                      <span className="text-xs font-sans text-white font-bold">
                        Student LMS & CBT
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <Link
                    to={ROUTES.TEACHER.ROOT}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-amber-400 font-bold block">
                        FACULTY CONSOLE
                      </span>
                      <span className="text-xs font-sans text-white font-bold">
                        Educator Test Studio
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <div className="pt-2">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>256-BIT ENCRYPTED TELEMETRY</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ======================================================== */}
          {/* CAMPUS NETWORK RADAR BAR                                 */}
          {/* ======================================================== */}
          <div className="py-6 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span className="font-bold text-white uppercase">ACADEMY CENTERS:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {campuses.map((camp) => (
                <button
                  key={camp.city}
                  type="button"
                  onClick={() => setActiveCampus(camp.city)}
                  className={`px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-2 ${
                    activeCampus === camp.city
                      ? 'bg-white text-black border-white font-black shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'glass-pill text-slate-300 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeCampus === camp.city ? 'bg-black' : 'bg-emerald-400'}`} />
                  <span>{camp.city}</span>
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-slate-400">
              {campuses.find(c => c.city === activeCampus)?.location} • <span className="text-[#CCFF00]">{campuses.find(c => c.city === activeCampus)?.status}</span>
            </div>
          </div>

          {/* Architectural Legal & Status Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
              <span>© {new Date().getFullYear()} BRAINSTORM ACADEMY. ALL RIGHTS RESERVED.</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase">
              <span className="hover:text-white transition-colors cursor-pointer">PRIVACY POLICY</span>
              <span>•</span>
              <span className="hover:text-white transition-colors cursor-pointer">TERMS OF SERVICE</span>
              <span>•</span>
              <span className="text-[#CCFF00] font-bold">RELEASE V4.9 // STABLE</span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* HOLOGRAPHIC 3D FROSTED GLASS WATERMARK SHOWPIECE           */}
          {/* ========================================================== */}
          <div className="pt-16 pb-6 text-center select-none relative overflow-hidden">
            
            {/* Luminous Multicolor Aurora Behind Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-[140px] bg-gradient-to-r from-[#CCFF00]/25 via-[#38BDF8]/30 to-[#A855F7]/25 blur-[90px] pointer-events-none rounded-full" />
            
            {/* Top Laser Guide Hairline */}
            <div className="relative flex items-center justify-center gap-4 mb-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/40" />
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-slate-400 flex items-center gap-2">
                <span className="text-[#CCFF00]">✦</span>
                <span>COGNITIVE PEDAGOGY INFRASTRUCTURE</span>
                <span className="text-[#38BDF8]">✦</span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/40" />
            </div>

            {/* Primary Glowing 3D Frosted Glass Text */}
            <div className="relative inline-block w-full">
              <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11.2rem] tracking-tight sm:tracking-tighter uppercase block leading-none bg-gradient-to-b from-white via-white/50 to-white/10 bg-clip-text text-transparent text-stroke-glass drop-shadow-[0_15px_45px_rgba(204,255,0,0.2)]">
                BRAINSTORM
              </h1>

              {/* Sub-surface Iridescent Reflection Beam */}
              <div className="absolute inset-0 font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11.2rem] tracking-tight sm:tracking-tighter uppercase block leading-none bg-gradient-to-r from-transparent via-[#CCFF00]/30 via-[#38BDF8]/30 to-transparent bg-clip-text text-transparent pointer-events-none opacity-40 blur-[1px]">
                BRAINSTORM
              </div>
            </div>

            {/* Inverted Frosted Glass Floor Puddle Reflection */}
            <div 
              aria-hidden="true" 
              className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] xl:text-[11.2rem] tracking-tight sm:tracking-tighter uppercase block leading-none text-white/5 transform scale-y-[-0.32] -mt-3 sm:-mt-6 md:-mt-8 pointer-events-none select-none blur-[2px]"
              style={{
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)'
              }}
            >
              BRAINSTORM
            </div>

            {/* Bottom Laser Line with Center Pill */}
            <div className="relative flex items-center justify-center gap-4 mt-2">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent" />
              <div className="glass-pill px-3 py-0.5 rounded-full font-mono text-[9px] text-[#CCFF00] tracking-widest uppercase">
                EST. 2018 // BIHAR • DELHI • UP
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#38BDF8]/40 to-transparent" />
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
