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
    <div className="space-y-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Super Admin Welcome Banner - Scrub Dark Glassmorphism */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#10B981] to-transparent" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CCFF00] via-[#a3e635] to-[#84cc16] text-black flex items-center justify-center font-mono font-black text-2xl shadow-[0_0_25px_rgba(204,255,0,0.35)] ring-1 ring-white/20 flex-shrink-0">
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#CCFF00] uppercase font-bold">
                [ CENTRAL CONTROL NODE &middot; SUPER ADMIN ]
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              Brainstorm Academy Central Control & Database Management Panel
            </p>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setModalConfig({ isOpen: true, defaultRole: 'teacher' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => setModalConfig({ isOpen: true, defaultRole: 'admin' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-[#CCFF00]/40 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4 text-[#CCFF00]" />
            <span>Add Admin</span>
          </button>
          <Link
            to="/dashboard/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#CCFF00]" />
            <span>New Course</span>
          </Link>
        </div>
      </div>

      {/* USER ACCESS & ROLE GOVERNANCE SECTION (Requirement 2) */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00]/60 via-[#10B981]/60 to-transparent" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#CCFF00]" />
              <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-tight">
                User Management & Access Control
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] font-bold">
                REALTIME DB
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              Provision teachers and admins securely. Manage accounts, reset credentials, or disable access without logging out.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="admin-btn-add-teacher"
              onClick={() => setModalConfig({ isOpen: true, defaultRole: 'teacher' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Teacher</span>
            </button>
            <button
              type="button"
              id="admin-btn-add-admin"
              onClick={() => setModalConfig({ isOpen: true, defaultRole: 'admin' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] cursor-pointer"
            >
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <span>Add Admin</span>
            </button>
            <Link
              to="/dashboard/admin/teachers"
              id="admin-btn-manage-teachers"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-[#CCFF00]/40 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#CCFF00]" />
              <span>Manage Teachers</span>
            </Link>
            <Link
              to="/dashboard/admin/admins"
              id="admin-btn-manage-admins"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-emerald-400/40 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Manage Admins</span>
            </Link>
            <Link
              to="/dashboard/admin/students"
              id="admin-btn-manage-students"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Manage Students</span>
            </Link>
          </div>
        </div>

        {/* Realtime Database Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">RTDB Faculty Records</p>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                {rtdbStats.teachers} <span className="text-xs text-[#CCFF00] font-normal">Active Teachers</span>
              </p>
            </div>
            <Link
              to="/dashboard/admin/teachers"
              className="text-xs font-mono text-[#CCFF00] hover:underline flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">RTDB Admin Accounts</p>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                {rtdbStats.admins} <span className="text-xs text-emerald-400 font-normal">Super Admins</span>
              </p>
            </div>
            <Link
              to="/dashboard/admin/admins"
              className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Learner Profiles</p>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                {rtdbStats.students || stats.totalStudents} <span className="text-xs text-cyan-400 font-normal">Students</span>
              </p>
            </div>
            <Link
              to="/dashboard/admin/students"
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* DASHBOARD STATISTICS (Calculated from actual authorized database queries) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#CCFF00]" />
            Platform Live Metrics
          </h2>
          <span className="text-xs font-mono text-slate-400">Cloud Firestore Realtime</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-[#0E121A]/85 rounded-2xl p-5 border border-white/10 shadow-xl space-y-2">
                <Skeleton className="h-4 w-20 bg-white/10" />
                <Skeleton className="h-6 w-12 bg-white/10" />
                <Skeleton className="h-3 w-28 bg-white/10" />
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
              color="#CCFF00"
            />
            <StatCard
              icon={UserCheck}
              label="Total Teachers"
              value={stats.totalTeachers.toString()}
              sub="Faculty accounts"
              color="#10B981"
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
              color="#38BDF8"
            />
            <StatCard
              icon={GraduationCap}
              label="Active Enrollments"
              value={stats.activeEnrollments.toString()}
              sub="Active subscriptions"
              color="#A855F7"
            />
            <StatCard
              icon={ClipboardList}
              label="Published Tests"
              value={stats.publishedTests.toString()}
              sub="Mock & chapter exams"
              color="#06B6D4"
            />
            <StatCard
              icon={HelpCircle}
              label="Pending Doubts"
              value={stats.pendingDoubts.toString()}
              sub="Unresolved queries"
              color="#EC4899"
            />
            <StatCard
              icon={CreditCard}
              label="Verified Payments"
              value={stats.verifiedPaymentsCount.toString()}
              sub="Orders completed"
              color="#10B981"
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
              color="#CCFF00"
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
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                Recent Student Admissions
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Live user profiles fetched directly from Cloud Firestore
              </p>
            </div>
            <Link
              to="/dashboard/admin/students"
              className="text-xs font-mono font-bold text-[#CCFF00] hover:underline"
            >
              Manage All Students →
            </Link>
          </div>

          {loading ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                  <Skeleton className="h-4 w-40 bg-white/10" />
                  <Skeleton className="h-4 w-20 bg-white/10" />
                  <Skeleton className="h-4 w-16 bg-white/10" />
                </div>
              ))}
            </div>
          ) : recentStudents.length === 0 ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 text-center shadow-2xl">
              <Users className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-white font-display">No Students Registered Yet</p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Student accounts will appear here once users complete registration.
              </p>
            </div>
          ) : (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Student</th>
                    <th className="py-3.5 px-4">Class / Exam</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 font-mono">
                  {recentStudents.map((s) => (
                    <tr key={s.uid} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 text-[#CCFF00] font-bold flex items-center justify-center text-xs flex-shrink-0 font-display">
                            {(s.displayName || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white font-display">{s.displayName || 'Student'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {s.classGrade || s.targetExam || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {s.phone || '–'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Recent Audit Trail
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Security log of administrative actions
              </p>
            </div>
            <Link
              to="/dashboard/admin/audit-logs"
              className="text-xs font-mono font-bold text-[#CCFF00] hover:underline"
            >
              Full Log →
            </Link>
          </div>

          {loading ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-2 border-b border-white/5 space-y-1">
                  <Skeleton className="h-4 w-32 bg-white/10" />
                  <Skeleton className="h-3 w-48 bg-white/10" />
                </div>
              ))}
            </div>
          ) : recentAuditLogs.length === 0 ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 text-center shadow-2xl">
              <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-white font-display">Audit Log Active</p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Every course update, teacher approval, and settings change will be logged here automatically.
              </p>
            </div>
          ) : (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-2xl divide-y divide-white/5">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-white mt-1.5 font-medium line-clamp-1 font-mono">
                    {log.details || `Modified ${log.targetCollection}`}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">By: {log.adminEmail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Shortcuts Box */}
          <div className="bg-[#0E121A]/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#CCFF00]" />
              Administrative Master Control
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Manage all administrative modules without manual code modifications. All records sync in real-time with Cloud Firestore.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <Link
                to="/dashboard/admin/settings"
                className="px-3 py-1.5 rounded-xl font-mono text-xs bg-white/5 border border-white/10 hover:border-[#CCFF00]/30 hover:bg-white/10 transition text-slate-200"
              >
                Website Settings
              </Link>
              <Link
                to="/dashboard/admin/reports"
                className="px-3 py-1.5 rounded-xl font-mono text-xs bg-white/5 border border-white/10 hover:border-[#CCFF00]/30 hover:bg-white/10 transition text-slate-200"
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
