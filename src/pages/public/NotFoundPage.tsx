import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, GraduationCap, Compass } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle('404 — Page Not Found');
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full text-center">
        {/* Animated 404 Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#EEF3FB] text-[#2457A7] mb-6 shadow-sm ring-8 ring-blue-50/50">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        <p className="text-sm font-bold tracking-widest text-[#2457A7] uppercase mb-2">
          Error 404
        </p>

        <h1 className="text-4xl sm:text-5xl font-black text-[#172033] font-display tracking-tight mb-4">
          Lost in your learning journey?
        </h1>

        <p className="text-base sm:text-lg text-[#6B7280] mb-8 leading-relaxed max-w-md mx-auto">
          The page or lesson you are looking for has been moved, renamed, or doesn't exist.
          Let's get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Button
            variant="navy"
            size="lg"
            to={ROUTES.HOME}
            leftIcon={<Home className="w-5 h-5" />}
          >
            Back to Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Go Back
          </Button>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#2457A7]" />
            Helpful Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            <Link
              to={ROUTES.SCHOOL_COURSES}
              className="p-2.5 rounded-xl hover:bg-gray-50 text-[#172033] hover:text-[#2457A7] font-medium flex items-center justify-between transition-colors border border-gray-50"
            >
              <span>School Courses (6-12)</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link
              to={ROUTES.COMPETITIVE_EXAMS}
              className="p-2.5 rounded-xl hover:bg-gray-50 text-[#172033] hover:text-[#2457A7] font-medium flex items-center justify-between transition-colors border border-gray-50"
            >
              <span>Competitive Exams</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link
              to={ROUTES.STUDY_MATERIALS}
              className="p-2.5 rounded-xl hover:bg-gray-50 text-[#172033] hover:text-[#2457A7] font-medium flex items-center justify-between transition-colors border border-gray-50"
            >
              <span>Study Materials</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link
              to={ROUTES.STUDENT.ROOT}
              className="p-2.5 rounded-xl hover:bg-gray-50 text-[#172033] hover:text-[#2457A7] font-medium flex items-center justify-between transition-colors border border-gray-50"
            >
              <span>Student Portal</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
