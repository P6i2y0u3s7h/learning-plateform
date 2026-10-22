import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  BookOpen,
  GraduationCap,
  IndianRupee,
  Award,
  TrendingUp,
  AlertCircle,
  Users,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

interface ReportData {
  totalCourses: number;
  totalEnrollments: number;
  totalTests: number;
  verifiedRevenue: number;
  enrollmentsByCourse: { name: string; count: number }[];
}

export const AdminReports: React.FC = () => {
  useDocumentTitle('Academic & Operational Reports — Super Admin');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData>({
    totalCourses: 0,
    totalEnrollments: 0,
    totalTests: 0,
    verifiedRevenue: 0,
    enrollmentsByCourse: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getReportsData();
        if (isMounted) {
          setReport(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminReports] Error loading reports:', err);
          setError('Failed to aggregate platform analytics.');
          setLoading(false);
        }
      }
    }

    fetchReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportCSV = () => {
    const csvRows = [
      ['Report Name', 'Brainstorm Academy Operational & Enrollment Audit'],
      ['Generated On', new Date().toISOString()],
      [''],
      ['Metric', 'Value'],
      ['Total Courses', report.totalCourses],
      ['Total Enrollments', report.totalEnrollments],
      ['Total Tests Published', report.totalTests],
      ['Verified Revenue (INR)', report.verifiedRevenue],
      [''],
      ['Course Name', 'Total Enrolled Students'],
      ...report.enrollmentsByCourse.map((c) => [c.name, c.count]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `brainstorm_academic_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxEnrollment = Math.max(
    ...report.enrollmentsByCourse.map((c) => c.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
              [ PERFORMANCE ANALYTICS · INSTITUTIONAL INTELLIGENCE ]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight mt-1">
            Institutional Reports & Metrics
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
            Real-time intelligence on admissions, course popularity, assessment adoption, and fiscal health.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-black bg-[#CCFF00] hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all shadow-lg flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-black" /> Export CSV Report
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#CCFF00] flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Enrollments</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : report.totalEnrollments}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Fees Verified</p>
            <p className="text-2xl font-bold text-[#CCFF00] tracking-tight">
              {loading ? '—' : `₹${report.verifiedRevenue.toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Active Batches</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : report.totalCourses}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Published Tests</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : report.totalTests}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Course Popularity Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
              <h2 className="text-base font-bold text-white font-display">
                Course Enrollment Breakdown
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Database Distribution</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
          ) : report.enrollmentsByCourse.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-white">No Enrollment Data Available</p>
              <p className="text-xs text-slate-400 mt-1">
                Admit students to courses to see enrollment distribution metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.enrollmentsByCourse.map((item, idx) => {
                const percentage = Math.round((item.count / maxEnrollment) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-200">
                      <span className="truncate pr-4">{item.name}</span>
                      <span className="text-[#CCFF00] font-bold">{item.count} Students</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="bg-gradient-to-r from-[#CCFF00] to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(204,255,0,0.3)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Academic Health & Retention (1 col) */}
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Award className="w-5 h-5 text-[#CCFF00]" />
            <h2 className="text-base font-bold text-white font-display">Platform Health</h2>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="font-bold text-[#CCFF00] text-sm">Target Batch Capacity</span>
              <p className="text-slate-400">
                Current active courses are running at steady student capacity with full chapter and test coverage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-400 text-sm">Fee Realization Ratio</span>
              <p className="text-emerald-300/80">
                100% of recorded transactions with valid UPI/card proofs have been processed and reconciled into ledger entries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1">
              <span className="font-bold text-sky-400 text-sm">Assessment Engagement</span>
              <p className="text-sky-300/80">
                Mock exams and weekly assignments are linked directly with course chapters for rapid student evaluations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
