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
    <div className="space-y-6">
      {/* Header - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Evaluation
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Practice & Mock Tests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate real exam conditions with timed chapter tests, full-syllabus mocks, and instant scoring.
          </p>
        </div>

        <Link
          to="/dashboard/student/results"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 w-fit"
        >
          <Award className="w-4 h-4 text-white" />
          <span>View Past Results</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
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
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Test Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
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
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 tracking-tight">
            No Practice Tests Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            {tests.length === 0
              ? 'New chapter practice tests will be scheduled as you progress through your enrolled courses.'
              : 'No tests match your search. Try resetting your query.'}
          </p>
          <Link
            to="/mock-tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95"
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
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group text-slate-900 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {t.targetCategory || 'Practice Quiz'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition line-clamp-2 mb-2">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed">
                    {t.description || 'Targeted test to evaluate retention, speed, and accuracy.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs mb-6">
                    <div>
                      <p className="text-slate-500 text-[11px]">Total Questions</p>
                      <p className="font-bold text-slate-900 mt-0.5">{t.questionsCount || 25} Qs</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Total Marks</p>
                      <p className="font-bold text-blue-600 mt-0.5">{t.totalMarks || 100} pts</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTestForModal(t)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Start Practice Test</span>
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs text-slate-500">
              <p>
                Showing page <strong className="text-slate-900 font-bold">{currentPage}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === p
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
