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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 05 // INTERACTIVE SESSIONS ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Upcoming Live Classes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Participate in live faculty lectures, conceptual question hours, and weekly doubt resolutions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
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
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <Radio className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            No Live Sessions Currently Scheduled
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-md mx-auto mb-6 leading-relaxed">
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
                className={`bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between text-white relative overflow-hidden group ${
                  isLiveNow
                    ? 'border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30'
                    : 'border-white/10 hover:border-[#CCFF00]/40'
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[11px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {cls.subjectName || 'Live Lecture'}
                    </span>
                    {isLiveNow ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {cls.durationMinutes} mins
                      </span>
                    )}
                  </div>

                  <h3 className="font-mono font-bold text-base text-white group-hover:text-[#CCFF00] transition mb-2 line-clamp-2">
                    {cls.title}
                  </h3>

                  <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed">
                    {cls.description || 'Interactive lecture covering essential syllabus fundamentals and practice exercises.'}
                  </p>

                  <div className="bg-[#060C17] rounded-2xl p-3.5 space-y-1.5 text-xs font-mono text-slate-300 border border-white/10 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Scheduled Time:</span>
                      <span className="font-bold text-[#CCFF00]">{cls.scheduledAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Faculty / Mentor:</span>
                      <span className="text-slate-200">{cls.instructorName || 'Senior Faculty'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinClass(cls)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 ${
                    isLiveNow
                      ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                      : 'bg-[#CCFF00] text-black hover:bg-white shadow-[0_0_15px_rgba(204,255,0,0.25)]'
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
