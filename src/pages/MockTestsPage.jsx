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
    <div className="w-full bg-[#F8FAFC] text-slate-900 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-600 font-semibold">CBT Mock Test Simulator</span>
        </div>

        {/* Header Banner (EduCore Theme) */}
        <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border border-blue-200/80 rounded-3xl p-8 sm:p-12 mb-10 relative overflow-hidden shadow-sm">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>NTA-Standard Timed Assessment Engine</span>
          </div>

          <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-slate-900">
            Authentic Exam-Pattern{' '}
            <span className="text-blue-600">
              Mock Test Series.
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
            Test your knowledge under timed exam conditions. Get instant score breakdowns, negative marking analysis, and topic-wise diagnostic performance evaluation.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-200 shadow-sm'
                }`}
              >
                {cat === 'All' ? 'All Mock Tests' : `${cat} Tests`}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Available Papers: <span className="font-bold text-blue-600">{filteredTests.length} Tests</span>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md p-6 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    test.difficulty === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {test.difficulty} Difficulty
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{test.class}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors leading-snug">
                  {test.title}
                </h3>

                <p className="text-xs text-slate-500 mb-5 line-clamp-2">
                  <strong className="text-slate-700 font-semibold">Syllabus:</strong> {test.syllabus}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-6 text-center text-xs">
                  <div>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase">Questions</p>
                    <p className="font-bold text-slate-900 mt-0.5">{test.questions}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase">Time</p>
                    <p className="font-bold text-slate-900 mt-0.5">{test.duration}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase">Marks</p>
                    <p className="font-bold text-blue-600 mt-0.5">{test.totalMarks}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {test.attempts} attempts
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTestModal(test)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Mock</span>
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
            title="Exam Instructions & Guidelines"
            size="md"
            footer={
              <div className="flex items-center justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTestModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Link
                  to={ROUTES.STUDENT.TESTS}
                  onClick={() => setActiveTestModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
                >
                  Enter Exam Room →
                </Link>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
                <h4 className="font-bold text-slate-900 text-base">
                  {activeTestModal.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                    <span>⏱ Duration: <strong className="text-slate-900">{activeTestModal.duration}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                    <span>📝 Questions: <strong className="text-slate-900">{activeTestModal.questions}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                    <span>🎯 Max Marks: <strong className="text-blue-600">{activeTestModal.totalMarks}</strong></span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Exam Rules & Guidelines:</h5>
                <ul className="space-y-2 list-disc pl-5 text-slate-600 leading-relaxed">
                  <li>Each correct response carries marks according to the official pattern.</li>
                  <li>Ensure a stable internet connection before beginning the assessment.</li>
                  <li>The timer cannot be paused once initiated.</li>
                  <li>Your submission will generate detailed analytics in your Student Dashboard.</li>
                </ul>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
