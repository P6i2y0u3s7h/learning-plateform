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

      {/* Top Banner Card */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />
        
        {/* Squircle Avatar with glowing accent */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CCFF00] via-[#10B981] to-[#047857] text-black flex items-center justify-center font-mono font-black text-3xl flex-shrink-0 shadow-[0_0_30px_rgba(204,255,0,0.35)] ring-1 ring-white/20">
          {formData.displayName ? formData.displayName[0].toUpperCase() : 'U'}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <h1 className="font-mono font-black text-2xl text-white tracking-tight">
              {formData.displayName || 'Academic Scholar'}
            </h1>
            <span className="bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {role}
            </span>
            {userProfile?.approvalStatus && (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px] px-2.5 py-0.5 rounded uppercase">
                {userProfile.approvalStatus}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{user?.email}</span>
          </p>
        </div>

        {/* Email Verification Status */}
        <div className="flex items-center gap-2">
          {isEmailVerified ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs px-3.5 py-1.5 rounded-xl font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Verified Email
            </span>
          ) : (
            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-xs px-3.5 py-1.5 rounded-xl font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Unverified Email
              </span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail || emailSentNotice}
                className="text-xs text-[#CCFF00] font-mono font-bold hover:underline disabled:opacity-50 transition-colors"
              >
                {emailSentNotice ? 'Verification link dispatched' : 'Resend link →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs sm:text-sm font-mono flex items-center gap-3 animate-in fade-in shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs sm:text-sm font-mono flex items-center gap-3 animate-in fade-in shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Edit Form */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
            [ 02 // STUDENT IDENTITY DOSSIER ]
          </span>
        </div>

        <h2 className="font-mono font-black text-xl text-white tracking-tight mb-1">
          Profile Information
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-mono mb-6">
          Update your contact details and academic goals. Your account role is server-enforced and cannot be altered from this panel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#CCFF00]" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Rahul Kumar"
                required
                className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#CCFF00]" />
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Class / Standard */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#CCFF00]" />
                Class / Standard
              </label>
              <input
                type="text"
                value={formData.classGrade}
                onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                placeholder="Class 10 / BPSC / AMU Prep"
                className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
              />
            </div>

            {/* Target Examination */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#CCFF00]" />
                Target Examination
              </label>
              <input
                type="text"
                value={formData.targetExam}
                onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                placeholder="e.g. CBSE Boards, BPSC TRE 4.0, Bihar SI, AMU Class 11"
                className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* City / Town */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#CCFF00]" />
                City / Town
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Patna, Lucknow, Aligarh"
                className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
              />
            </div>

            {/* State */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#CCFF00]" />
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Bihar, Uttar Pradesh, Delhi"
                className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
              />
            </div>
          </div>

          {/* Bio / Objective */}
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
              Bio / Academic Objective
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell instructors and mentors about your preparation goals, target score, or dream institutions..."
              className="w-full px-4 py-3 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 font-mono outline-none transition-all"
            />
          </div>

          {/* Security Notice Box */}
          <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#CCFF00]" />
              <span>Account Role:</span>
              <strong className="text-white uppercase font-black bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {role}
              </strong>
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              Role verified via Cloud Firestore Rules
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Persisting...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
