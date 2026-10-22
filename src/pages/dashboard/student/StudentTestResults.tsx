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
              [ 08 // PERFORMANCE RECORDS ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Test Results & Assessment History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Review your scores, passing ratios, answer accuracy, and time allocation across all attempts.
          </p>
        </div>

        <Link
          to="/dashboard/student/tests"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 w-fit"
        >
          <ClipboardList className="w-4 h-4 stroke-[2.5]" />
          <span>Take a Practice Test</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
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
          color="#38BDF8"
        />
        <StatCard
          icon={CheckCircle2}
          label="Passed Tests"
          value={stats.passed.toString()}
          sub={stats.total > 0 ? `${Math.round((stats.passed / stats.total) * 100)}% pass rate` : '–'}
          color="#10B981"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats.avgScore}
          sub="Across all mock attempts"
          color="#CCFF00"
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
        <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            No Test Attempts Recorded Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-sm mx-auto mb-6 leading-relaxed">
            You haven't attempted any mock tests yet. Take an assessment to track your scores, uncover weak spots, and view detailed answer rationales.
          </p>
          <Link
            to="/dashboard/student/tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.25)] active:scale-95"
          >
            <span>Browse Available Tests</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm font-mono">
                <thead className="bg-[#060C17] border-b border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-white/10 text-slate-200">
                  {paginatedAttempts.map((att) => {
                    const minutes = Math.round((att.timeSpentSeconds || 0) / 60);
                    const isPass = att.isPassed;

                    return (
                      <tr key={att.id} className="hover:bg-white/[0.03] transition">
                        <td className="py-4 px-4 sm:px-6 font-bold text-white">
                          {att.testTitle || 'Mock Assessment'}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-xs">
                          {att.startedAt ? new Date(att.startedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-xs">
                          {minutes > 0 ? `${minutes} mins` : '< 1 min'}
                        </td>
                        <td className="py-4 px-4 font-bold text-[#CCFF00]">
                          {att.score} / {att.totalMarks}
                        </td>
                        <td className="py-4 px-4 font-bold">
                          <span
                            className={
                              isPass ? 'text-emerald-400' : 'text-amber-400'
                            }
                          >
                            {att.percentage}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {isPass ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" />
                              Needs Review
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/dashboard/student/test-results/${att.id}`}
                              className="text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/15 border border-[#38BDF8]/30 hover:bg-[#38BDF8] hover:text-black px-3 py-1.5 rounded-xl transition"
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
    </div>
  );
};

export default StudentTestResults;
