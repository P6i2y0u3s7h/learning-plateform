import React, { useState } from 'react';
import {
  Play,
  Lock,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lesson } from '../../types';

export interface VideoPlayerProps {
  lesson?: Lesson;
  isAuthorized?: boolean;
  title?: string;
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'direct' | 'hls' | 'custom';
  durationMinutes?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  courseId?: string;
  courseTitle?: string;
  onToggleComplete?: () => void;
  className?: string;
}

/**
 * Extracts a safe YouTube embed URL from various link formats.
 */
function getYouTubeEmbedUrl(urlOrId: string): string | null {
  if (!urlOrId) return null;
  // If already an embed URL
  if (urlOrId.includes('youtube.com/embed/')) return urlOrId;

  // Extract ID from youtube.com/watch?v=...
  const watchMatch = urlOrId.match(/[?&]v=([^&#]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  }

  // Extract ID from youtu.be/...
  const shortMatch = urlOrId.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
  }

  // If it's a raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return `https://www.youtube-nocookie.com/embed/${urlOrId}?rel=0&modestbranding=1`;
  }

  return urlOrId;
}

/**
 * Extracts a Vimeo embed URL.
 */
function getVimeoEmbedUrl(urlOrId: string): string | null {
  if (!urlOrId) return null;
  if (urlOrId.includes('player.vimeo.com/video/')) return urlOrId;
  const match = urlOrId.match(/vimeo\.com\/(\d+)/);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}?dnt=1`;
  }
  return urlOrId;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lesson,
  isAuthorized,
  title,
  videoUrl,
  videoProvider,
  durationMinutes,
  isLocked,
  isCompleted = false,
  courseId,
  courseTitle,
  onToggleComplete,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const displayTitle = title || lesson?.title || 'Video Lesson';
  const displayUrl = videoUrl || lesson?.videoUrl || '';
  const displayProvider =
    videoProvider || (lesson?.videoProvider as any) || 'youtube';
  const displayDuration = durationMinutes || lesson?.durationMinutes || 30;
  const displayCourseId = courseId || lesson?.courseId;
  const displayCourseTitle = courseTitle || lesson?.courseTitle;

  const locked =
    isLocked !== undefined
      ? isLocked
      : isAuthorized !== undefined
      ? !isAuthorized
      : false;

  // If locked, render security overlay preventing unauthorized playback
  if (locked) {
    return (
      <div
        className={`relative aspect-video w-full rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center shadow-xl overflow-hidden ${className}`}
      >
        {/* Subtle decorative glowing background */}
        <div className="absolute inset-0 bg-radial-gradient from-blue-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider mb-2">
              Premium Enrolled Content
            </span>
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
              {displayTitle}
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              This video lecture and accompanying resources require an active enrollment in{' '}
              <span className="text-white font-medium">{displayCourseTitle || 'this course'}</span>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {displayCourseId ? (
              <Link
                to={`/courses/${displayCourseId}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2457A7] to-[#17365D] hover:from-[#1d4787] hover:to-[#0f2440] text-white text-xs font-bold shadow-md transition"
              >
                Enroll to Unlock All Lessons
              </Link>
            ) : (
              <Link
                to="/school-courses"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2457A7] to-[#17365D] text-white text-xs font-bold transition"
              >
                Browse Course Catalog
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detect provider if not specified
  const effectiveProvider =
    displayProvider ||
    (displayUrl.includes('vimeo')
      ? 'vimeo'
      : displayUrl.includes('youtu')
      ? 'youtube'
      : 'direct');

  const youtubeUrl =
    effectiveProvider === 'youtube' ? getYouTubeEmbedUrl(displayUrl) : null;
  const vimeoUrl =
    effectiveProvider === 'vimeo' ? getVimeoEmbedUrl(displayUrl) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video w-full rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden group">
        {effectiveProvider === 'youtube' && youtubeUrl ? (
          <iframe
            src={youtubeUrl}
            title={displayTitle}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : effectiveProvider === 'vimeo' && vimeoUrl ? (
          <iframe
            src={vimeoUrl}
            title={displayTitle}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : displayUrl.endsWith('.mp4') ||
          displayUrl.endsWith('.webm') ||
          effectiveProvider === 'direct' ? (
          <video
            controls
            controlsList="nodownload"
            className="w-full h-full object-contain"
            src={displayUrl}
          >
            Your browser does not support HTML5 video streaming.
          </video>
        ) : (
          /* Safe fallback player with mock lecture animation */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-tr from-slate-950 via-slate-900 to-[#17365D]">
            <div className="w-16 h-16 rounded-full bg-[#2457A7] flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition cursor-pointer">
              <Play className="w-7 h-7 text-white fill-current ml-1" />
            </div>
            <h4 className="font-bold text-base max-w-md">{displayTitle}</h4>
            <p className="text-xs text-blue-200 mt-1">
              {displayDuration ? `${displayDuration} minutes duration` : 'High Definition Lecture'}
            </p>
          </div>
        )}
      </div>

      {/* Lesson Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-4 h-4 text-[#2457A7]" />
          <span>Duration: <strong>{displayDuration} mins</strong></span>
          <span className="text-gray-300">•</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> High Definition Stream
          </span>
        </div>

        {onToggleComplete && (
          <button
            onClick={onToggleComplete}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-[#17365D] text-white hover:bg-[#2457A7]'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Completed ✓' : 'Mark Lesson as Completed'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
