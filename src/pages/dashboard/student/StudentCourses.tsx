import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  PlayCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookMarked,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type { Enrollment, Course } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Loading';
import { EmptyState } from '../../../components/common/EmptyState';
import { ProgressBar } from '../../../components/UI';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

interface EnrolledCourseCardData {
  enrollment: Enrollment;
  course?: Course;
}

const ITEMS_PER_PAGE = 6;

export const StudentCourses: React.FC = () => {
  useDocumentTitle('My Enrolled Courses — Brainstorm Academy');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseCardData[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadEnrollments() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const enrollments = await studentService.getStudentEnrollments(user.uid);

        if (enrollments.length === 0) {
          if (isMounted) {
            setEnrolledCourses([]);
            setLoading(false);
          }
          return;
        }

        const courseIds = enrollments.map((e) => e.courseId);
        const courses = await studentService.getCoursesByIds(courseIds);
        const courseMap = new Map<string, Course>();
        courses.forEach((c) => courseMap.set(c.id, c));

        const combined: EnrolledCourseCardData[] = enrollments.map((enr) => ({
          enrollment: enr,
          course: courseMap.get(enr.courseId),
        }));

        if (isMounted) {
          setEnrolledCourses(combined);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load student courses:', err);
          setError('Unable to load your courses. Please check your internet connection.');
          setLoading(false);
        }
      }
    }

    loadEnrollments();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Filtered & Paginated records
  const filteredCourses = useMemo(() => {
    return enrolledCourses.filter(({ enrollment, course }) => {
      const title = course?.title || enrollment.courseTitle || '';
      const subject = course?.subjectName || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const progress = enrollment.progressPercentage || 0;
      if (statusFilter === 'completed') return progress >= 100;
      if (statusFilter === 'in_progress') return progress < 100;
      return true;
    });
  }, [enrolledCourses, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 03 // CURRICULUM ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            My Enrolled Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Access your active syllabi, resume chapters, and monitor curriculum completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/school-courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95"
          >
            <span>Browse More Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls: Search & Status Filters */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by course title or subject..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#060C17] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              statusFilter === 'all'
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.25)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            All ({enrolledCourses.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('in_progress');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              statusFilter === 'in_progress'
                ? 'bg-[#38BDF8] text-black border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => {
              setStatusFilter('completed');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              statusFilter === 'completed'
                ? 'bg-emerald-400 text-black border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="pt-2">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl text-center relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-20 h-20 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h3 className="font-mono font-black text-xl sm:text-2xl text-white mb-2 tracking-tight">
            {enrolledCourses.length === 0
              ? 'No Enrolled Courses Found'
              : 'No matching courses found'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-md mx-auto mb-8 leading-relaxed">
            {enrolledCourses.length === 0
              ? 'You have not enrolled in any programs yet. Explore our targeted school curriculums, competitive exam batches, and entrance test preparation modules.'
              : 'Try clearing your search query or switching your status filter to see other enrolled subjects.'}
          </p>

          {enrolledCourses.length === 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/school-courses"
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.25)] active:scale-95"
              >
                School Courses (Class 6–12)
              </Link>
              <Link
                to="/competitive-exams"
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider bg-[#38BDF8] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)] active:scale-95"
              >
                Competitive Exams (BPSC / TET)
              </Link>
              <Link
                to="/amu-jamia"
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider bg-[#F4B942] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(244,185,66,0.25)] active:scale-95"
              >
                AMU & Jamia Entrances
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 border border-[#CCFF00]/30 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.map(({ enrollment, course }) => {
              const progress = enrollment.progressPercentage || 0;
              const title = course?.title || enrollment.courseTitle || 'Course Title';
              const subject = course?.subjectName || 'General';
              const targetId = course?.id || enrollment.courseId;
              const isCompleted = progress >= 100;

              return (
                <div
                  key={enrollment.id}
                  className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl hover:border-[#CCFF00]/40 transition-all flex flex-col justify-between group text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="text-[11px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {subject}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Course Title */}
                    <h3 className="font-mono font-bold text-white text-base group-hover:text-[#CCFF00] transition line-clamp-2 mb-2">
                      {title}
                    </h3>

                    {/* Description or details */}
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed">
                      {course?.shortDescription ||
                        course?.description ||
                        'Comprehensive syllabus coverage with interactive lectures and assessments.'}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-6 bg-[#060C17] p-3.5 rounded-2xl border border-white/10 font-mono text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-medium">Syllabus Completion</span>
                        <span className="font-bold text-[#CCFF00]">{progress}%</span>
                      </div>
                      <ProgressBar
                        value={progress}
                        color={isCompleted ? '#10B981' : '#CCFF00'}
                        height={6}
                      />
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                        <span>
                          {enrollment.completedLessonIds?.length || 0} lessons completed
                        </span>
                        <span>{course?.totalLessons || '–'} total</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <Link
                      to={`/dashboard/student/classroom/${targetId}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.25)] active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4 text-black" />
                      <span>{isCompleted ? 'Review Lessons' : 'Resume Learning'}</span>
                    </Link>
                    <Link
                      to="/dashboard/student/materials"
                      className="px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 transition"
                      title="Download Notes"
                    >
                      Notes
                    </Link>
                  </div>
                </div>
              );
            })}
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                      currentPage === page
                        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
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

export default StudentCourses;
