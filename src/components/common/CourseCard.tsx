import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Layers, ArrowRight, Star, Users, CheckCircle, GraduationCap, User } from 'lucide-react';
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
  instructorName?: string;
  teacherName?: string;
  thumbnailUrl?: string;
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
  const subject = course.subject || course.subjectName || course.stream || 'Curriculum';
  const cls = course.class || course.classGrade;
  const category = course.category || course.categoryId || 'school';
  const targetExam = course.targetExam;
  const description = course.description;
  const chapters = course.chapters || course.totalChapters || 10;
  const lessons = course.lessons || course.totalLessons || 45;
  const duration = course.duration || (course.durationHours ? `${course.durationHours} hrs` : '60 hrs');
  const tags = course.tags || [];
  const badge = course.badge || (course.price === 0 ? 'FREE BATCH' : null);
  const rating = course.rating || course.averageRating || 4.9;
  const enrolledStudents = course.enrolledStudents || course.enrolledStudentsCount || 850;
  const price = course.price ?? 0;
  const originalPrice = course.originalPrice;
  const teacherName = course.instructorName || course.teacherName;

  const categoryLabel = targetExam || (category === 'school' ? cls : subject) || 'Course';

  return (
    <div
      className={cn(
        'group bg-white border border-slate-200/90 rounded-2xl relative flex flex-col justify-between overflow-hidden transition-all duration-300',
        'hover:border-blue-200 hover:shadow-md hover:-translate-y-1',
        className
      )}
    >
      {/* Top Academic Tag Strip */}
      <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="font-sans text-xs text-blue-700 tracking-wide uppercase font-semibold">
            {categoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {badge && (
            <span className="font-sans text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {badge}
            </span>
          )}
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>{rating}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.8rem] mb-2 tracking-tight">
            {title}
          </h3>

          {description && (
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3.5 font-sans">
              {description}
            </p>
          )}

          {/* Teacher name if present */}
          {teacherName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium">Faculty: {teacherName}</span>
            </div>
          )}

          {/* Metrics HUD Bar */}
          <div className="grid grid-cols-3 border border-slate-100 bg-slate-50/80 py-2 px-1 text-center font-sans text-xs mb-4 rounded-xl">
            <div className="border-r border-slate-200/60 px-1">
              <span className="block text-slate-400 text-[10px] uppercase font-medium">Chapters</span>
              <span className="font-semibold text-slate-700">{chapters}</span>
            </div>
            <div className="border-r border-slate-200/60 px-1">
              <span className="block text-slate-400 text-[10px] uppercase font-medium">Lessons</span>
              <span className="font-semibold text-slate-700">{lessons}</span>
            </div>
            <div className="px-1">
              <span className="block text-slate-400 text-[10px] uppercase font-medium">Duration</span>
              <span className="font-semibold text-slate-700">{duration}</span>
            </div>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 font-sans text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Progress bar if enrolled */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex justify-between font-sans text-xs text-slate-600 mb-1">
                <span className="font-medium">Completion</span>
                <span className="font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card Footer with Price & EduCore CTA */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
          <div>
            {price > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-lg text-slate-900">
                  {formatCurrency(price)}
                </span>
                {originalPrice && (
                  <span className="font-sans text-xs text-slate-400 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-sans text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Free Batch
              </span>
            )}
          </div>

          <Link
            to={`/courses/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-sans text-xs font-semibold hover:bg-blue-700 transition-all shadow-xs"
          >
            <span>{enrolled ? 'Continue Learning' : 'View Course'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
