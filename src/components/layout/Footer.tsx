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
  BookOpen,
  Target,
  FileText,
  Award,
  ChevronRight,
  Users,
  Globe2
} from 'lucide-react';
import brandLogo from '../../assets/brand-logo.jpg';
import { APP_CONFIG } from '../../constants/app';
import { ROUTES } from '../../constants/routes';

export const Footer: React.FC = () => {
  const [istTime, setIstTime] = useState<string>('');
  const [inquiryInput, setInquiryInput] = useState<string>('');
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);

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
    <footer className="mt-auto bg-white text-slate-700 pt-16 pb-12 border-t border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Status & Telemetry Bar */}
        <div className="pb-8 mb-10 border-b border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Platform 100% Operational</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{istTime || 'Live IST'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span className="text-blue-600">Admissions 2026–27</span>
            <span>•</span>
            <span>Foundation & Target Batches Active</span>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-200/80">
          
          {/* 1. Brand & Information (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Link to={ROUTES.HOME} className="flex items-center gap-3 inline-flex mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center overflow-hidden shadow-xs">
                  <img 
                    src={brandLogo} 
                    alt="Brainstorm Academy Logo" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xl tracking-tight block">
                    Brainstorm <span className="text-blue-600">Academy.</span>
                  </span>
                  <span className="text-[11px] text-blue-600 tracking-wider uppercase block font-bold">
                    Learn Today. Lead Tomorrow.
                  </span>
                </div>
              </Link>

              <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md">
                Premier academic learning platform providing structured preparation across CBSE school grades (6th–12th), state competitive recruitments (BPSC TRE, Bihar SI, Super TET), and central universities (AMU & Jamia Millia Islamia).
              </p>

              {/* Syllabus Blueprint Form */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 mb-6 max-w-md shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Get 2026 Exam Blueprint & Syllabus</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                    FREE PDF
                  </span>
                </div>
                
                {inquirySubmitted ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    <span>Request received! Syllabus sent to your WhatsApp/Email.</span>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inquiryInput}
                      onChange={(e) => setInquiryInput(e.target.value)}
                      placeholder="Enter mobile or email address..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors shadow-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 shadow-xs"
                    >
                      <span>Get</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Connect Links */}
              <div className="grid grid-cols-2 gap-2 text-xs max-w-md">
                <a
                  href={`tel:${APP_CONFIG.contact.phone}`}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center gap-2 text-slate-700 hover:text-blue-600 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate font-medium">{APP_CONFIG.contact.phone}</span>
                </a>

                <a
                  href={`mailto:${APP_CONFIG.contact.email}`}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex items-center gap-2 text-slate-700 hover:text-blue-600 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate font-medium">{APP_CONFIG.contact.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* 2. Educational Programs Directory (4 cols) */}
          <div className="lg:col-span-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
              Curriculum & Programs
            </h3>

            <div className="space-y-2">
              {[
                { to: ROUTES.SCHOOL_COURSES, icon: BookOpen, title: 'School Courses (6th–12th)', tag: 'CBSE & NCERT' },
                { to: ROUTES.COMPETITIVE_EXAMS, icon: Target, title: 'Competitive Examinations', tag: 'BPSC TRE • SI' },
                { to: ROUTES.AMU_JAMIA, icon: GraduationCap, title: 'AMU & Jamia Millia Entrances', tag: 'Class 9/11/Diploma' },
                { to: ROUTES.STUDY_MATERIALS, icon: FileText, title: 'Study Notes & Revision Materials', tag: 'Curated PDFs' },
                { to: ROUTES.MOCK_TESTS, icon: Award, title: 'Mock Tests & Exam Practice', tag: 'CBT Test Series' },
              ].map((prog, idx) => (
                <Link
                  key={idx}
                  to={prog.to}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <prog.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                        {prog.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 block">
                        {prog.tag}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* 3. Portals & Campuses (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
                Academy Portals
              </h3>

              <div className="space-y-2 text-xs">
                <Link
                  to={ROUTES.STUDENT.ROOT}
                  className="block p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors shadow-xs"
                >
                  <span className="font-semibold text-slate-900 block hover:text-blue-600">Student Dashboard</span>
                  <span className="text-[11px] text-slate-500">Access courses, tests & progress</span>
                </Link>

                <Link
                  to={ROUTES.TEACHER.ROOT}
                  className="block p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors shadow-xs"
                >
                  <span className="font-semibold text-slate-900 block hover:text-blue-600">Teacher Portal</span>
                  <span className="text-[11px] text-slate-500">Manage materials, batches & tests</span>
                </Link>

                <Link
                  to={ROUTES.ADMIN.ROOT}
                  className="block p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors shadow-xs"
                >
                  <span className="font-semibold text-slate-900 block hover:text-blue-600">Admin Dashboard</span>
                  <span className="text-[11px] text-slate-500">User management & platform control</span>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Centers & Campuses
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                {campuses.map((c) => (
                  <div key={c.city} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                    <span className="text-slate-800 font-semibold">{c.city}</span>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Brainstorm Academy. Learn Today. Lead Tomorrow. All Rights Reserved.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link to={ROUTES.SCHOOL_COURSES} className="hover:text-blue-600 transition-colors">Courses</Link>
            <Link to={ROUTES.MOCK_TESTS} className="hover:text-blue-600 transition-colors">Mock Tests</Link>
            <Link to={ROUTES.STUDY_MATERIALS} className="hover:text-blue-600 transition-colors">Study Notes</Link>
            <Link to={ROUTES.LOGIN} className="hover:text-blue-600 transition-colors">Sign In</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
