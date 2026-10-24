import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  BookOpen,
  ClipboardList,
  GraduationCap,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  Sparkles,
  UserPlus,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import { listenToAllUsers } from '../../../services/adminAccountService';
import { AddUserModal } from '../../../components/admin/AddUserModal';
import type { UserProfile, AuditLog } from '../../../types';
import { StatCard, Button, Badge } from '../../../components/UI';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminOverview: React.FC = () => {
  useDocumentTitle('Super Admin Dashboard — Brainstorm Academy');
  const { userProfile, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Management Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    defaultRole: 'teacher' | 'admin';
  }>({
    isOpen: false,
    defaultRole: 'teacher',
  });

  // Authoritative Realtime Database Counters
  const [rtdbStats, setRtdbStats] = useState({
    teachers: 0,
    admins: 0,
    students: 0,
  });

  // Real live statistics from Firestore
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingTeacherApprovals: 0,
    totalCourses: 0,
    publishedCourses: 0,
    activeEnrollments: 0,
    publishedTests: 0,
    pendingDoubts: 0,
    verifiedPaymentsCount: 0,
    totalRevenue: 0,
  });

  const [recentStudents, setRecentStudents] = useState<UserProfile[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        setLoading(true);
        setError(null);

        const [dashboardStats, students, auditLogs] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getStudents(),
          adminService.getAuditLogs(),
        ]);

        if (isMounted) {
          setStats(dashboardStats);
          setRecentStudents(students.slice(0, 5));
          setRecentAuditLogs(auditLogs.slice(0, 5));
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminOverview] Error loading admin records:', err);
          setError('Failed to fetch platform statistics from database.');
          setLoading(false);
        }
      }
    }

    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-Time Firebase Realtime Database Listener for Live User Counters
  useEffect(() => {
    const unsubscribe = listenToAllUsers((users) => {
      let teachers = 0;
      let admins = 0;
      let students = 0;
      users.forEach((u) => {
        if (u.role === 'teacher') teachers++;
        else if (u.role === 'admin') admins++;
        else if (u.role === 'student') students++;
      });
      setRtdbStats({ teachers, admins, students });
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      {/* Super Admin Welcome Banner (EduCore Theme) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-2xl shadow-sm flex-shrink-0">
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-[11px] tracking-wider text-blue-600 uppercase font-bold">
                Platform Control Center &middot; Super Admin
              </span>
            </div>
            <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Brainstorm Academy Central Control & Database Management Panel
            </p>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setModalConfig({ isOpen: true, defaultRole: 'teacher' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => setModalConfig({ isOpen: true, defaultRole: 'admin' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <Shield className="w-4 h-4 text-blue-300" />
            <span>Add Admin</span>
          </button>
          <Link
            to="/dashboard/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>New Course</span>
          </Link>
        </div>
      </div>

      {/* USER ACCESS & ROLE GOVERNANCE SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h2 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                User Management & Access Control
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold uppercase">
                Realtime DB
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Provision teachers and admins securely. Manage accounts, reset credentials, or disable access with ease.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="admin-btn-add-teacher"
              onClick={() => setModalConfig({ isOpen: true, defaultRole: 'teacher' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Teacher</span>
            </button>
            <button
              type="button"
              id="admin-btn-add-admin"
              onClick={() => setModalConfig({ isOpen: true, defaultRole: 'admin' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            >
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <span>Add Admin</span>
            </button>
            <Link
              to="/dashboard/admin/teachers"
              id="admin-btn-manage-teachers"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Manage Teachers</span>
            </Link>
            <Link
              to="/dashboard/admin/admins"
              id="admin-btn-manage-admins"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Manage Admins</span>
            </Link>
            <Link
              to="/dashboard/admin/students"
              id="admin-btn-manage-students"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Manage Students</span>
            </Link>
          </div>
        </div>

        {/* Realtime Database Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-blue-200 transition flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">RTDB Faculty Records</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {rtdbStats.teachers} <span className="text-xs text-blue-600 font-normal">Active Teachers</span>
              </p>
            </div>
            <Link
              to="/dashboard/admin/teachers"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:border-indigo-200 transition flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">RTDB Admin Accounts</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {rtdbStats.admins} <span className="text-xs text-indigo-600 font-normal">Super Admins</span>
              </p>
            </div>
            <Link
              to="/dashboard/admin/admins"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Learner Profiles</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {rtdbStats.students || stats.totalStudents} <span className="text-xs text-slate-600 font-normal">Students</span>
              </p>
            </div>
            <Link
              to="/dashboard/admin/students"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* DASHBOARD STATISTICS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Platform Live Metrics
          </h2>
          <span className="text-xs text-slate-500 font-medium">Synced with Cloud Firestore</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              icon={Users}
              label="Total Students"
              value={stats.totalStudents.toString()}
              sub="Registered learners"
              color="#2563EB"
            />
            <StatCard
              icon={UserCheck}
              label="Total Teachers"
              value={stats.totalTeachers.toString()}
              sub="Faculty accounts"
              color="#16A34A"
            />
            <StatCard
              icon={AlertCircle}
              label="Pending Approvals"
              value={stats.pendingTeacherApprovals.toString()}
              sub={stats.pendingTeacherApprovals > 0 ? 'Requires attention' : 'All approved'}
              color="#F59E0B"
            />
            <StatCard
              icon={BookOpen}
              label="Total Courses"
              value={stats.totalCourses.toString()}
              sub={`${stats.publishedCourses} published`}
              color="#2563EB"
            />
            <StatCard
              icon={GraduationCap}
              label="Active Enrollments"
              value={stats.activeEnrollments.toString()}
              sub="Course admissions"
              color="#1E3A8A"
            />
            <StatCard
              icon={ClipboardList}
              label="Published Tests"
              value={stats.publishedTests.toString()}
              sub="Mock & chapter exams"
              color="#0284C7"
            />
            <StatCard
              icon={HelpCircle}
              label="Pending Doubts"
              value={stats.pendingDoubts.toString()}
              sub="Unresolved queries"
              color="#DC2626"
            />
            <StatCard
              icon={CreditCard}
              label="Verified Payments"
              value={stats.verifiedPaymentsCount.toString()}
              sub="Orders completed"
              color="#16A34A"
            />
            <StatCard
              icon={TrendingUp}
              label="Platform Revenue"
              value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
              sub="Total fee collection"
              color="#F59E0B"
            />
            <StatCard
              icon={ShieldCheck}
              label="Security Status"
              value="Enforced"
              sub="Cloud Security Rules"
              color="#16A34A"
            />
          </div>
        )}
      </div>

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Student Admissions (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Recent Student Admissions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Profiles fetched directly from Cloud Firestore
              </p>
            </div>
            <Link
              to="/dashboard/admin/students"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Manage All Students →
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center shadow-sm">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-900">No Students Registered Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Student accounts will appear here once users complete registration.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Student</th>
                    <th className="py-3.5 px-4">Class / Exam</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentStudents.map((s) => (
                    <tr key={s.uid} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {(s.displayName || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{s.displayName || 'Student'}</p>
                            <p className="text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {s.classGrade || s.targetExam || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {s.phone || '–'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Audit Trail Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Recent Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Security log of administrative actions
              </p>
            </div>
            <Link
              to="/dashboard/admin/audit-logs"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Full Log →
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-2 border-b border-slate-100 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          ) : recentAuditLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center shadow-sm">
              <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-900">Audit Log Active</p>
              <p className="text-xs text-slate-500 mt-1">
                Every course update, teacher approval, and settings change will be logged here automatically.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm divide-y divide-slate-100">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1.5 font-medium line-clamp-1">
                    {log.details || `Modified ${log.targetCollection}`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">By: {log.adminEmail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Shortcuts Box */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Administrative Master Control
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Manage all administrative modules without manual code modifications. All records sync in real-time with Cloud Firestore.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <Link
                to="/dashboard/admin/settings"
                className="px-3.5 py-1.5 rounded-xl font-semibold bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition text-slate-700"
              >
                Website Settings
              </Link>
              <Link
                to="/dashboard/admin/reports"
                className="px-3.5 py-1.5 rounded-xl font-semibold bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition text-slate-700"
              >
                Analytics Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add Teacher / Add Admin Modal */}
      <AddUserModal
        isOpen={modalConfig.isOpen}
        defaultRole={modalConfig.defaultRole}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminOverview;
