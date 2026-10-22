import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, RefreshCw, LogOut, Mail, GraduationCap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const TeacherPendingPage: React.FC = () => {
  useDocumentTitle('Application Under Review — Brainstorm Academy');
  const { userProfile, refreshProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);

    if (userProfile?.approvalStatus === 'approved') {
      navigate('/dashboard/teacher');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl text-center">
        {/* Status Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs ring-8 ring-amber-50/50">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full inline-block mb-3">
          Teacher Account Verification
        </span>

        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#172033] mb-3">
          Application Under Review
        </h1>

        <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
          Thank you for applying to educate on <span className="font-bold text-[#17365D]">Brainstorm Academy</span>. To maintain high academic standards, teacher accounts require administrator verification before teaching tools and student management features are unlocked.
        </p>

        {/* Application Details Summary */}
        {userProfile && (
          <div className="bg-[#F7F9FC] p-4 rounded-2xl border border-gray-200 text-left mb-6 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-500 font-medium">Applicant Name:</span>
              <span className="font-bold text-[#172033]">{userProfile.displayName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-500 font-medium">Registered Email:</span>
              <span className="font-semibold text-[#172033]">{userProfile.email}</span>
            </div>
            {userProfile.subjectSpecialization && (
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Specialization:</span>
                <span className="font-semibold text-[#17365D]">{userProfile.subjectSpecialization}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500 font-medium">Current Status:</span>
              <span className="bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                {userProfile.approvalStatus || 'Pending Review'}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleRefresh}
            loading={checking}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Check Approval Status
          </Button>

          <Button
            variant="outline"
            size="md"
            to={ROUTES.HOME}
            className="w-full justify-center"
          >
            Browse Public Courses
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="w-full justify-center text-gray-500 hover:text-red-600"
          >
            Sign Out
          </Button>
        </div>

        {/* Administration Note */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-[11px] text-[#6B7280]">
          <p className="flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#2457A7]" />
            Need urgent assistance? Contact{' '}
            <a href="mailto:admin@brainstormacademy.in" className="text-[#2457A7] font-semibold underline">
              admin@brainstormacademy.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherPendingPage;
