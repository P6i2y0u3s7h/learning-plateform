import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Radio,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type { LiveClass } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const StudentUpcomingClasses: React.FC = () => {
  useDocumentTitle('Upcoming Live Classes — Brainstorm Academy');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<LiveClass[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadClasses() {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getUpcomingClasses();
        if (isMounted) {
          setClasses(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load upcoming classes:', err);
          setError('Unable to load live class schedule.');
          setLoading(false);
        }
      }
    }

    loadClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleJoinClass = (liveClass: LiveClass) => {
    if (liveClass.meetingUrl) {
      window.open(liveClass.meetingUrl, '_blank');
    } else {
      alert(
        `Class "${liveClass.title}" will open 10 minutes prior to scheduled start (${liveClass.scheduledAt}).`
      );
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Interactive Sessions
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Upcoming Live Classes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Participate in live faculty lectures, conceptual question hours, and weekly doubt resolutions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Radio className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 tracking-tight">
            No Live Sessions Currently Scheduled
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Live lectures and doubt clearing classrooms are scheduled regularly by your mentors. You will receive notification alerts once upcoming sessions are announced.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {classes.map((cls) => {
            const isLiveNow = cls.status === 'live';

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${
                  isLiveNow
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {cls.subjectName || 'Live Lecture'}
                    </span>
                    {isLiveNow ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {cls.durationMinutes} mins
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition mb-2 line-clamp-2">
                    {cls.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {cls.description || 'Interactive lecture covering essential syllabus fundamentals and practice exercises.'}
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700 border border-slate-200/60 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Scheduled Time:</span>
                      <span className="font-semibold text-slate-900">{cls.scheduledAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Faculty / Mentor:</span>
                      <span className="text-slate-800 font-medium">{cls.instructorName || 'Senior Faculty'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinClass(cls)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95 ${
                    isLiveNow
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Video className="w-4 h-4 stroke-[2.5]" />
                  <span>{isLiveNow ? 'Join Live Room Now' : 'Join Classroom'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentUpcomingClasses;
