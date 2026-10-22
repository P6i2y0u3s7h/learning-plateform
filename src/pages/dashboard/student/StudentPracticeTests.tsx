import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Clock,
  Award,
  CheckCircle,
  HelpCircle,
  Play,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type { Test } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import TestInstructionsModal from '../../../components/exam/TestInstructionsModal';

const ITEMS_PER_PAGE = 6;

export const StudentPracticeTests: React.FC = () => {
  useDocumentTitle('Practice & Mock Tests — Brainstorm Academy');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestForModal, setSelectedTestForModal] = useState<Test | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadTests() {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getAvailablePracticeTests();
        if (isMounted) {
          setTests(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load practice tests:', err);
          setError('Unable to load practice tests right now.');
          setLoading(false);
        }
      }
    }

    loadTests();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      return (
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.targetCategory && t.targetCategory.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [tests, searchQuery]);

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE) || 1;
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTests, currentPage]);

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 06 // EVALUATION ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Practice & Mock Tests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Simulate real exam conditions with timed chapter tests, full-syllabus mocks, and instant scoring.
          </p>
        </div>

        <Link
          to="/dashboard/student/results"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 w-fit"
        >
          <Award className="w-4 h-4 stroke-[2.5]" />
          <span>View Past Results</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tests by title or exam category..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#060C17] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition font-sans"
          />
        </div>
      </div>

      {/* Test Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            No Practice Tests Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-sm mx-auto mb-6 leading-relaxed">
            {tests.length === 0
              ? 'New chapter practice tests will be scheduled as you progress through your enrolled courses.'
              : 'No tests match your search. Try resetting your query.'}
          </p>
          <Link
            to="/mock-tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.25)] active:scale-95"
          >
            <span>Explore Public Mock Tests</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTests.map((t) => (
              <div
                key={t.id}
                className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl hover:border-[#CCFF00]/40 transition-all flex flex-col justify-between group text-white relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[11px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {t.targetCategory || 'Practice Quiz'}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {t.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="font-mono font-bold text-base text-white group-hover:text-[#CCFF00] transition line-clamp-2 mb-2">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-5 leading-relaxed">
                    {t.description || 'Targeted test to evaluate retention, speed, and accuracy.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-[#060C17] border border-white/10 rounded-2xl p-3.5 text-xs font-mono mb-6">
                    <div>
                      <p className="text-slate-500">Total Questions</p>
                      <p className="font-bold text-white mt-0.5">{t.questionsCount || 25} Qs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Marks</p>
                      <p className="font-bold text-[#CCFF00] mt-0.5">{t.totalMarks || 100} pts</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTestForModal(t)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(204,255,0,0.25)] cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>Start Practice Test</span>
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono text-xs text-slate-400">
              <p>
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                      currentPage === p
                        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Instructions Protocol Modal */}
      {selectedTestForModal && (
        <TestInstructionsModal
          isOpen={true}
          test={selectedTestForModal}
          onClose={() => setSelectedTestForModal(null)}
          onStartExam={(testId) => {
            setSelectedTestForModal(null);
            navigate(`/dashboard/student/exam/${testId}`);
          }}
        />
      )}
    </div>
  );
};

export default StudentPracticeTests;
