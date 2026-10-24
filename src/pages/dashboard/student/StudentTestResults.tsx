import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type { TestAttempt } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { StatCard } from '../../../components/UI';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const StudentTestResults: React.FC = () => {
  useDocumentTitle('My Test Results & Analytics — Brainstorm Academy');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadResults() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getStudentTestAttempts(user.uid);
        if (isMounted) {
          setAttempts(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load test results:', err);
          setError('Unable to load your test history.');
          setLoading(false);
        }
      }
    }

    loadResults();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Dynamic Calculated Statistics (No hardcoded values!)
  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return {
        total: 0,
        passed: 0,
        avgScore: '0%',
        highestScore: '0%',
      };
    }
    const passed = attempts.filter((a) => a.isPassed).length;
    const avg = Math.round(
      attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
    );
    const highest = Math.max(...attempts.map((a) => a.percentage || 0));

    return {
      total: attempts.length,
      passed,
      avgScore: `${avg}%`,
      highestScore: `${highest}%`,
    };
  }, [attempts]);

  const totalPages = Math.ceil(attempts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAttempts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return attempts.slice(start, start + ITEMS_PER_PAGE);
  }, [attempts, currentPage]);

  return (
    <div className="space-y-6 relative">
      {/* Header - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Performance Records
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Test Results & Assessment History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your scores, passing ratios, answer accuracy, and time allocation across all attempts.
          </p>
        </div>

        <Link
          to="/dashboard/student/tests"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 w-fit"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Take a Practice Test</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="Total Attempts"
          value={stats.total.toString()}
          sub={stats.total > 0 ? `${stats.passed} tests passed` : 'No attempts recorded'}
          color="#2563EB"
        />
        <StatCard
          icon={CheckCircle2}
          label="Passed Tests"
          value={stats.passed.toString()}
          sub={stats.total > 0 ? `${Math.round((stats.passed / stats.total) * 100)}% pass rate` : '–'}
          color="#16A34A"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats.avgScore}
          sub="Across all mock attempts"
          color="#3B82F6"
        />
        <StatCard
          icon={Award}
          label="Highest Score"
          value={stats.highestScore}
          sub="Personal best"
          color="#F59E0B"
        />
      </div>

      {/* Test Attempts Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 tracking-tight">
            No Test Attempts Recorded Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            You haven't attempted any mock tests yet. Take an assessment to track your scores, uncover weak spots, and view detailed answer rationales.
          </p>
          <Link
            to="/dashboard/student/tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95"
          >
            <span>Browse Available Tests</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Test Title</th>
                    <th className="py-3.5 px-4">Date Taken</th>
                    <th className="py-3.5 px-4">Time Spent</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Percentage</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedAttempts.map((att) => {
                    const minutes = Math.round((att.timeSpentSeconds || 0) / 60);
                    const isPass = att.isPassed;

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900">
                          {att.testTitle || 'Mock Assessment'}
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-xs">
                          {att.startedAt ? new Date(att.startedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-xs">
                          {minutes > 0 ? `${minutes} mins` : '< 1 min'}
                        </td>
                        <td className="py-4 px-4 font-bold text-blue-700">
                          {att.score} / {att.totalMarks}
                        </td>
                        <td className="py-4 px-4 font-bold">
                          <span
                            className={
                              isPass ? 'text-emerald-600' : 'text-amber-600'
                            }
                          >
                            {att.percentage}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {isPass ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3 text-amber-600" />
                              Needs Review
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/dashboard/student/test-results/${att.id}`}
                              className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl transition"
                            >
                              Review Solutions
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs text-slate-500 font-medium">
              <p>
                Showing page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
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
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
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
    </div>
  );
};

export default StudentTestResults;
