import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Clock, HelpCircle, Award, CheckCircle2,
  AlertCircle, ChevronRight, PlayCircle, BarChart3, ShieldCheck, ArrowRight, Play
} from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import Modal from '../components/Modal';
import { ROUTES } from '../constants/routes';

export default function MockTestsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTestModal, setActiveTestModal] = useState(null);

  const mockTests = [
    {
      id: 'mt1',
      title: 'Class 10 Mathematics Full Syllabus Mock Test #1',
      category: 'School',
      class: 'Class 10',
      subject: 'Mathematics',
      questions: 40,
      duration: '90 mins',
      totalMarks: 80,
      difficulty: 'Moderate',
      attempts: 840,
      syllabus: 'Real Numbers, Polynomials, Linear Equations, Quadratic, AP, Triangles',
    },
    {
      id: 'mt2',
      title: 'Class 10 Science Comprehensive Practice Test (Physics & Chem)',
      category: 'School',
      class: 'Class 10',
      subject: 'Science',
      questions: 35,
      duration: '75 mins',
      totalMarks: 70,
      difficulty: 'Moderate',
      attempts: 650,
      syllabus: 'Chemical Reactions, Acids & Bases, Light Reflection & Refraction, Electricity',
    },
    {
      id: 'mt3',
      title: 'AMU Class 11 Science Entrance Simulator 2026',
      category: 'Entrance',
      class: 'AMU 11',
      subject: 'Combined Science & Math',
      questions: 100,
      duration: '120 mins',
      totalMarks: 100,
      difficulty: 'High',
      attempts: 1420,
      syllabus: 'Class 9 & 10 Physics, Chemistry, Life Sciences, Mathematics & Indo-Islamic',
    },
    {
      id: 'mt4',
      title: 'JEE Main Foundation Physics Practice Paper',
      category: 'Competitive',
      class: 'Class 11/12',
      subject: 'Physics',
      questions: 30,
      duration: '60 mins',
      totalMarks: 120,
      difficulty: 'High',
      attempts: 930,
      syllabus: 'Kinematics, Laws of Motion, Work Energy Power, Gravitation',
    },
    {
      id: 'mt5',
      title: 'Jamia Millia Islamia Class 9 Entrance Practice Paper',
      category: 'Entrance',
      class: 'Jamia 9',
      subject: 'All Subjects',
      questions: 100,
      duration: '120 mins',
      totalMarks: 100,
      difficulty: 'Moderate',
      attempts: 510,
      syllabus: 'Class 8 Syllabus - Science, Maths, Social Science & English Language',
    },
    {
      id: 'mt6',
      title: 'BPSC TRE 3.0 & 4.0 General Studies Full Mock',
      category: 'Competitive',
      class: 'Govt Exam',
      subject: 'GS & Pedagogy',
      questions: 120,
      duration: '120 mins',
      totalMarks: 120,
      difficulty: 'High',
      attempts: 2340,
      syllabus: 'Modern Indian History, Geography, Polity, Elementary Math, Mental Ability',
    },
  ];

  const categories = ['All', 'School', 'Entrance', 'Competitive'];

  const filteredTests = selectedCategory === 'All'
    ? mockTests
    : mockTests.filter(t => t.category === selectedCategory);

  return (
    <div className="w-full bg-[#07080D] text-slate-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#CCFF00] font-semibold">CBT MOCK TEST SIMULATOR</span>
        </div>

        {/* Header Banner */}
        <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-8 sm:p-12 mb-12 text-white relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>NTA-STANDARD TIMED ASSESSMENT ENGINE</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight mb-4 text-white">
            AUTHENTIC EXAM-PATTERN{' '}
            <span className="font-editorial italic font-normal text-slate-300 normal-case">
              Mock Test Series.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-6 font-sans">
            Test your knowledge under timed conditions. Get instant score breakdowns, negative marking penalties, and topic-wise diagnostic performance evaluation.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-white text-black border-white font-extrabold shadow-md'
                    : 'bg-[#0E121A] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cat === 'All' ? 'All Mock Tests' : `${cat} Tests`}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs text-slate-400">
            AVAILABLE PAPERS: <span className="font-bold text-[#CCFF00]">{filteredTests.length} TESTS</span>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredTests.map((test, idx) => (
            <div
              key={test.id}
              className="bg-[#0E121A] rounded-2xl border border-white/10 hover:border-white/25 hover:bg-[#121722] p-6 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    test.difficulty === 'High'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {test.difficulty} DIFFICULTY
                  </span>
                  <span className="font-mono text-xs text-slate-400 font-semibold">{test.class}</span>
                </div>

                <h3 className="font-display font-extrabold text-white text-base sm:text-lg mb-2 group-hover:text-[#CCFF00] transition-colors leading-snug uppercase">
                  {test.title}
                </h3>

                <p className="text-xs text-slate-400 mb-5 line-clamp-2">
                  <strong className="text-slate-300">Syllabus:</strong> {test.syllabus}
                </p>

                {/* HUD Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 border border-white/5 rounded-xl mb-6 text-center font-mono text-xs">
                  <div>
                    <p className="text-slate-500 text-[9px] uppercase">QUESTIONS</p>
                    <p className="font-bold text-white mt-0.5">{test.questions}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[9px] uppercase">TIME</p>
                    <p className="font-bold text-white mt-0.5">{test.duration}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[9px] uppercase">MARKS</p>
                    <p className="font-bold text-[#CCFF00] mt-0.5">{test.totalMarks}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {test.attempts} ATTEMPTS
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTestModal(test)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#CCFF00] hover:text-black transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START MOCK</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {activeTestModal && (
          <Modal
            isOpen={!!activeTestModal}
            onClose={() => setActiveTestModal(null)}
            title="EXAM INSTRUCTIONS & GUIDELINES"
            size="md"
            footer={
              <div className="flex items-center justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTestModal(null)}
                  className="px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <Link
                  to={ROUTES.STUDENT.TESTS}
                  onClick={() => setActiveTestModal(null)}
                  className="px-5 py-2.5 rounded-full bg-[#CCFF00] text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#b8e600] transition-all shadow-sm cursor-pointer"
                >
                  ENTER EXAM ROOM
                </Link>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs">
                <h4 className="font-display font-extrabold text-slate-900 text-base uppercase tracking-tight">
                  {activeTestModal.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2.5 mt-3 font-mono text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold shadow-xs">
                    <span className="text-sm">⏱</span>
                    <span>DURATION: <span className="text-slate-950 font-black">{activeTestModal.duration}</span></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold shadow-xs">
                    <span className="text-sm">📝</span>
                    <span>QUESTIONS: <span className="text-slate-950 font-black">{activeTestModal.questions}</span></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold shadow-xs">
                    <span className="text-sm">🎯</span>
                    <span>MAX MARKS: <span className="text-slate-950 font-black">{activeTestModal.totalMarks}</span></span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <h5 className="font-mono font-bold text-slate-900 uppercase tracking-wider text-xs">EXAM RULES & GUIDELINES:</h5>
                <ul className="space-y-2 list-disc pl-5 text-slate-700 font-sans leading-relaxed">
                  <li>Each correct response carries marks according to the official pattern.</li>
                  <li>Ensure a stable internet connection before beginning the assessment.</li>
                  <li>The timer cannot be paused once initiated.</li>
                  <li>Your submission will generate detailed analytics in the Student Dashboard.</li>
                </ul>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
