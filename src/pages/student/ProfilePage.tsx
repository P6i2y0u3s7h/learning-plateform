import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  BookOpen,
  MapPin,
  CheckCircle,
  AlertCircle,
  Save,
  GraduationCap,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const ProfilePage: React.FC = () => {
  useDocumentTitle('Student Profile Dossier — Brainstorm Academy');
  const { user, userProfile, role, isEmailVerified, updateProfile, resendVerification } = useAuth();

  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || user?.displayName || '',
    phone: userProfile?.phone || '',
    classGrade: userProfile?.classGrade || 'Class 10',
    targetExam: userProfile?.targetExam || '',
    bio: userProfile?.bio || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      await updateProfile({
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim(),
        classGrade: formData.classGrade,
        targetExam: formData.targetExam.trim(),
        bio: formData.bio.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
      });
      setSuccessMessage('Profile identity dossier saved to Cloud Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      await resendVerification();
      setEmailSentNotice(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send verification email.';
      setErrorMessage(msg);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Top Banner Card - EduCore Theme */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-3xl flex-shrink-0 shadow-sm">
          {formData.displayName ? formData.displayName[0].toUpperCase() : 'U'}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">
              {formData.displayName || 'Academic Scholar'}
            </h1>
            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {role}
            </span>
            {userProfile?.approvalStatus && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-0.5 rounded-full uppercase">
                {userProfile.approvalStatus}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </p>
        </div>

        {/* Email Verification Status */}
        <div className="flex items-center gap-2">
          {isEmailVerified ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3.5 py-1.5 rounded-xl font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Verified Email
            </span>
          ) : (
            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3.5 py-1.5 rounded-xl font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Unverified Email
              </span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail || emailSentNotice}
                className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-50 transition-colors"
              >
                {emailSentNotice ? 'Verification link dispatched' : 'Resend link →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Edit Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Student Identity Dossier
        </div>

        <h2 className="font-extrabold text-xl text-slate-900 tracking-tight mb-1">
          Profile Information
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          Update your contact details and academic goals. Your account role is server-enforced and cannot be altered from this panel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Rahul Kumar"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Class / Standard */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Class / Standard
              </label>
              <input
                type="text"
                value={formData.classGrade}
                onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                placeholder="Class 10 / BPSC / AMU Prep"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* Target Examination */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Target Examination
              </label>
              <input
                type="text"
                value={formData.targetExam}
                onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                placeholder="e.g. CBSE Boards, BPSC TRE 4.0, Bihar SI, AMU Class 11"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* City / Town */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                City / Town
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Patna, Lucknow, Aligarh"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Bihar, Uttar Pradesh, Delhi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Bio / Objective */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Bio / Academic Objective
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell instructors and mentors about your preparation goals, target score, or dream institutions..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Security Notice Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Account Role:</span>
              <strong className="text-slate-900 uppercase font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {role}
              </strong>
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Role verified via Cloud Firestore Rules
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
