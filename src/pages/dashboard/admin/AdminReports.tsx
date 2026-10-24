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
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-50 border border-blue-200 text-blue-700">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Performance Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Reports & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time intelligence on admissions, course popularity, assessment adoption, and fiscal health.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm hover:shadow flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Enrollments</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : report.totalEnrollments}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Fees Verified</p>
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {loading ? '—' : `₹${report.verifiedRevenue.toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Batches</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : report.totalCourses}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Published Tests</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : report.totalTests}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Popularity Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Course Enrollment Breakdown
              </h2>
            </div>
            <span className="text-xs text-slate-400">Live Database Distribution</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
          ) : report.enrollmentsByCourse.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-800">No Enrollment Data Available</p>
              <p className="text-xs text-slate-500 mt-1">
                Admit students to courses to see enrollment distribution metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.enrollmentsByCourse.map((item, idx) => {
                const percentage = Math.round((item.count / maxEnrollment) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate pr-4">{item.name}</span>
                      <span className="text-blue-600 font-bold">{item.count} Students</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Platform Health</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
              <span className="font-bold text-blue-700 text-sm">Target Batch Capacity</span>
              <p className="text-slate-600">
                Current active courses are running at steady student capacity with full chapter and test coverage.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-700 text-sm">Fee Realization Ratio</span>
              <p className="text-slate-600">
                100% of recorded transactions with valid UPI/card proofs have been processed and reconciled into ledger entries.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-700 text-sm">Assessment Engagement</span>
              <p className="text-slate-600">
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
