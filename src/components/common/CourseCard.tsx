import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Layers, ArrowRight, Star, Users, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';

export interface CourseData {
  id: string;
  title: string;
  subject?: string;
  subjectName?: string;
  class?: string;
  classGrade?: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  targetExam?: string;
  stream?: string;
  chapters?: number;
  totalChapters?: number;
  lessons?: number;
  totalLessons?: number;
  duration?: string;
  durationHours?: number;
  level?: string;
  description?: string;
  tags?: string[];
  badge?: string | null;
  badgeColor?: string | null;
  rating?: number;
  averageRating?: number;
  enrolledStudents?: number;
  enrolledStudentsCount?: number;
  price?: number;
  originalPrice?: number;
  validityDays?: number;
}

export interface CourseCardProps {
  course: CourseData;
  indexNumber?: string | number;
  enrolled?: boolean;
  progress?: number;
  showProgress?: boolean;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  indexNumber,
  enrolled = false,
  progress = 0,
  showProgress = false,
  className,
}) => {
  const id = course.id;
  const title = course.title;
  const subject = course.subject || course.subjectName || course.stream || 'General';
  const cls = course.class || course.classGrade;
  const category = course.category || course.categoryId || 'school';
  const targetExam = course.targetExam;
  const description = course.description;
  const chapters = course.chapters || course.totalChapters || 10;
  const lessons = course.lessons || course.totalLessons || 45;
  const duration = course.duration || (course.durationHours ? `${course.durationHours} hrs` : '60 hrs');
  const tags = course.tags || [];
  const badge = course.badge || (course.price === 0 ? 'FREE' : null);
  const rating = course.rating || course.averageRating || 4.9;
  const enrolledStudents = course.enrolledStudents || course.enrolledStudentsCount || 850;
  const price = course.price ?? 0;
  const originalPrice = course.originalPrice;

  // Format index e.g. "01", "02"
  const formattedIndex = indexNumber
    ? String(indexNumber).padStart(2, '0')
    : undefined;

  return (
    <div
      className={cn(
        'group bg-[#0E121A] border border-white/10 rounded-2xl relative flex flex-col justify-between overflow-hidden transition-all duration-300',
        'hover:border-white/30 hover:bg-[#121722] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] hover:-translate-y-1',
        className
      )}
    >
      {/* Top Architectural Metadata Strip */}
      <div className="p-4 sm:p-5 pb-3 border-b border-white/5 flex items-center justify-between gap-2 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
          <span className="font-mono text-[10px] text-slate-400 tracking-[0.2em] uppercase font-semibold">
            {targetExam || subject || (category === 'school' ? cls : 'TRACK')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {badge && (
            <span className="font-mono text-[9px] tracking-[0.16em] uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
              {badge}
            </span>
          )}
          {formattedIndex && (
            <span className="font-mono text-[10px] text-slate-500 font-bold">
              {formattedIndex}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-extrabold text-white text-base sm:text-lg leading-snug group-hover:text-[#CCFF00] transition-colors line-clamp-2 min-h-[2.8rem] mb-2 uppercase tracking-tight">
            {title}
          </h3>

          {description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 font-sans">
              {description}
            </p>
          )}

          {/* Architectural Metrics HUD Bar */}
          <div className="grid grid-cols-3 border border-white/5 bg-black/40 py-2.5 px-1 text-center font-mono text-[11px] mb-4 rounded-xl">
            <div className="border-r border-white/5 px-1">
              <span className="block text-slate-500 text-[9px] uppercase tracking-wider">CHs</span>
              <span className="font-bold text-slate-200">{chapters}</span>
            </div>
            <div className="border-r border-white/5 px-1">
              <span className="block text-slate-500 text-[9px] uppercase tracking-wider">LESSONS</span>
              <span className="font-bold text-slate-200">{lessons}</span>
            </div>
            <div className="px-1">
              <span className="block text-slate-500 text-[9px] uppercase tracking-wider">HOURS</span>
              <span className="font-bold text-slate-200">{duration}</span>
            </div>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5"
                >
                  <CheckCircle className="w-2.5 h-2.5 text-[#CCFF00]" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Progress bar if enrolled */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-1.5">
                <span className="uppercase tracking-wider">COMPLETION</span>
                <span className="font-bold text-[#CCFF00]">{progress}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#CCFF00] h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card Footer with Price & Scrub-style CTA */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3 mt-2">
          <div>
            {price > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-black text-lg text-white">
                  {formatCurrency(price)}
                </span>
                {originalPrice && (
                  <span className="font-mono text-xs text-slate-500 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-1 rounded-full border border-[#CCFF00]/25">
                FREE BATCH
              </span>
            )}
          </div>

          <Link
            to={`/courses/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-mono text-xs tracking-[0.14em] uppercase font-bold transition-all hover:bg-[#CCFF00] hover:text-black group-hover:shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          >
            <span>{enrolled ? 'Resume' : 'View'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
