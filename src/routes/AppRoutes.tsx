import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Route Guard
import ProtectedRoute from './ProtectedRoute';
import RouteLoadingFallback from '../components/common/RouteLoadingFallback';
import { useAuth } from '../context/AuthContext';

// Public Pages (Static for instant FCP)
import {
  HomePage,
  SchoolCoursesPage,
  ClassPage,
  CompetitiveExamsPage,
  AmuJamiaPage,
  CourseDetailsPage,
  StudyMaterialsPage,
  MockTestsPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  NotFoundPage,
  UnauthorizedPage,
  TeacherPendingPage,
} from '../pages/public';

// Lazy Loaded Student Dashboard Pages (Direct component chunks for granular code-splitting)
const StudentOverview = React.lazy(() => import('../pages/dashboard/student/StudentOverview'));
const StudentCourses = React.lazy(() => import('../pages/dashboard/student/StudentCourses'));
const StudentStudyMaterials = React.lazy(() => import('../pages/dashboard/student/StudentStudyMaterials'));
const StudentUpcomingClasses = React.lazy(() => import('../pages/dashboard/student/StudentUpcomingClasses'));
const StudentPracticeTests = React.lazy(() => import('../pages/dashboard/student/StudentPracticeTests'));
const StudentAssignments = React.lazy(() => import('../pages/dashboard/student/StudentAssignments'));
const StudentTestResults = React.lazy(() => import('../pages/dashboard/student/StudentTestResults'));
const StudentNotifications = React.lazy(() => import('../pages/dashboard/student/StudentNotifications'));
const StudentAskDoubt = React.lazy(() => import('../pages/dashboard/student/StudentAskDoubt'));
const ProfilePage = React.lazy(() => import('../pages/student/ProfilePage'));
const StudentClassroom = React.lazy(() => import('../pages/dashboard/student/StudentClassroom'));
const StudentExamRoom = React.lazy(() => import('../pages/dashboard/student/StudentExamRoom'));
const TestResultDetail = React.lazy(() => import('../pages/dashboard/student/TestResultDetail'));
const StudentProgressReports = React.lazy(() => import('../pages/dashboard/student/StudentProgressReports'));
const StudentPaymentHistory = React.lazy(() => import('../pages/dashboard/student/StudentPaymentHistory'));

// Lazy Loaded Teacher Dashboard Pages (Direct component chunks for granular code-splitting)
const TeacherOverview = React.lazy(() => import('../pages/dashboard/teacher/TeacherOverview'));
const TeacherCourses = React.lazy(() => import('../pages/dashboard/teacher/TeacherCourses'));
const TeacherMaterials = React.lazy(() => import('../pages/dashboard/teacher/TeacherMaterials'));
const TeacherLessons = React.lazy(() => import('../pages/dashboard/teacher/TeacherLessons'));
const TeacherTests = React.lazy(() => import('../pages/dashboard/teacher/TeacherTests'));
const TeacherAssignments = React.lazy(() => import('../pages/dashboard/teacher/TeacherAssignments'));
const TeacherDoubts = React.lazy(() => import('../pages/dashboard/teacher/TeacherDoubts'));
const TeacherPerformance = React.lazy(() => import('../pages/dashboard/teacher/TeacherPerformance'));
const TeacherNotifications = React.lazy(() => import('../pages/dashboard/teacher/TeacherNotifications'));
const TeacherSettings = React.lazy(() => import('../pages/dashboard/teacher/TeacherSettings'));

// Lazy Loaded Admin Dashboard Pages
const AdminOverview = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminOverview })));
const AdminStudents = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminStudents })));
const AdminTeachers = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminTeachers })));
const AdminCourses = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminCourses })));
const AdminCurriculum = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminCurriculum })));
const AdminMaterials = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminMaterials })));
const AdminTests = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminTests })));
const AdminAssignments = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminAssignments })));
const AdminEnrollments = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminEnrollments })));
const AdminPayments = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminPayments })));
const AdminNotifications = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminNotifications })));
const AdminDoubts = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminDoubts })));
const AdminReports = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminReports })));
const AdminSettings = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminSettings })));
const AdminAuditLogs = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminAuditLogs })));
const AdminAdmins = React.lazy(() => import('../pages/admin').then(m => ({ default: m.AdminAdmins })));

const DashboardIndexRedirect: React.FC = () => {
  const { role } = useAuth();
  if (role === 'admin') {
    return <Navigate to="admin" replace />;
  }
  if (role === 'teacher') {
    return <Navigate to="teacher" replace />;
  }
  return <Navigate to="student" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      {/* Public Routes with MainLayout (Navbar + Footer) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/school-courses" element={<SchoolCoursesPage />} />
        <Route path="/school-courses/:classId" element={<ClassPage />} />
        <Route path="/competitive-exams" element={<CompetitiveExamsPage />} />
        <Route path="/amu-jamia" element={<AmuJamiaPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="/study-materials" element={<StudyMaterialsPage />} />
        <Route path="/mock-tests" element={<MockTestsPage />} />

        {/* Authentication Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Role-specific dashboard route aliases */}
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/teacher/dashboard" element={<Navigate to="/dashboard/teacher" replace />} />
        <Route path="/student/dashboard" element={<Navigate to="/dashboard/student" replace />} />

        {/* Security & Authorization Fallback Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/teacher-pending" element={<TeacherPendingPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Fullscreen Secure Timed Examination Room (Isolated from Dashboard Sidebar) */}
      <Route
        path="/dashboard/student/exam/:testId"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <StudentExamRoom />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Dashboard Routes with DashboardLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* ======================================================== */}
        {/* STUDENT PORTAL (Accessible by Student, Teacher, & Admin) */}
        {/* ======================================================== */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />
          }
        >
          <Route path="student" element={<StudentOverview />} />
          <Route path="student/profile" element={<ProfilePage />} />
          <Route path="student/courses" element={<StudentCourses />} />
          <Route path="student/classroom/:courseId" element={<StudentClassroom />} />
          <Route path="student/classroom/:courseId/:lessonId" element={<StudentClassroom />} />
          <Route path="student/materials" element={<StudentStudyMaterials />} />
          <Route path="student/classes" element={<StudentUpcomingClasses />} />
          <Route path="student/tests" element={<StudentPracticeTests />} />
          <Route path="student/assignments" element={<StudentAssignments />} />
          <Route path="student/results" element={<StudentTestResults />} />
          <Route path="student/test-results/:attemptId" element={<TestResultDetail />} />
          <Route path="student/progress" element={<StudentProgressReports />} />
          <Route path="student/notifications" element={<StudentNotifications />} />
          <Route path="student/doubts" element={<StudentAskDoubt />} />
          <Route path="student/payments" element={<StudentPaymentHistory />} />
          <Route path="student/settings" element={<ProfilePage />} />
        </Route>

        {/* ======================================================== */}
        {/* TEACHER PORTAL (Strictly Restricted to Teacher & Admin) */}
        {/* ======================================================== */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['teacher', 'admin']}
              requireTeacherApproval={false}
            />
          }
        >
          <Route path="teacher" element={<TeacherOverview />} />
          <Route path="teacher/courses" element={<TeacherCourses />} />
          <Route path="teacher/materials" element={<TeacherMaterials />} />
          <Route path="teacher/lessons" element={<TeacherLessons />} />
          <Route path="teacher/assignments" element={<TeacherAssignments />} />
          <Route path="teacher/tests" element={<TeacherTests />} />
          <Route path="teacher/doubts" element={<TeacherDoubts />} />
          <Route path="teacher/performance" element={<TeacherPerformance />} />
          <Route path="teacher/notifications" element={<TeacherNotifications />} />
          <Route path="teacher/settings" element={<TeacherSettings />} />
        </Route>

        {/* ======================================================== */}
        {/* ADMIN PORTAL (Restricted to Super Admins Only)          */}
        {/* ======================================================== */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['admin']}
            />
          }
        >
          <Route path="admin" element={<AdminOverview />} />
          <Route path="admin/students" element={<AdminStudents />} />
          <Route path="admin/teachers" element={<AdminTeachers />} />
          <Route path="admin/courses" element={<AdminCourses />} />
          <Route path="admin/categories" element={<AdminCurriculum />} />
          <Route path="admin/subjects" element={<AdminCurriculum />} />
          <Route path="admin/chapters" element={<AdminCurriculum />} />
          <Route path="admin/lessons" element={<AdminCurriculum />} />
          <Route path="admin/materials" element={<AdminMaterials />} />
          <Route path="admin/tests" element={<AdminTests />} />
          <Route path="admin/assignments" element={<AdminAssignments />} />
          <Route path="admin/enrollments" element={<AdminEnrollments />} />
          <Route path="admin/payments" element={<AdminPayments />} />
          <Route path="admin/doubts" element={<AdminDoubts />} />
          <Route path="admin/notifications" element={<AdminNotifications />} />
          <Route path="admin/reports" element={<AdminReports />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="admin/admins" element={<AdminAdmins />} />
        </Route>

        {/* Dynamic redirect to role dashboard */}
        <Route index element={<DashboardIndexRedirect />} />
      </Route>
    </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
