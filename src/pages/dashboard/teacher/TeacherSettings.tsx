import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Save,
  GraduationCap,
  Sparkles,
  Award,
  Clock,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const TeacherSettings: React.FC = () => {
  useDocumentTitle('Faculty Profile & Academic Settings — Brainstorm Academy');
  const { user, userProfile, role, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || user?.displayName || '',
    phone: userProfile?.phone || '',
    subjectSpecialization: userProfile?.subjectSpecialization || 'Mathematics',
    highestQualification: (userProfile as any)?.highestQualification || 'M.Sc. Mathematics / B.Ed',
    experienceYears: (userProfile as any)?.experienceYears || '7',
    officeHours: (userProfile as any)?.officeHours || 'Mon - Fri (4:00 PM - 7:00 PM)',
    bio: userProfile?.bio || 'Passionate educator committed to simplifying complex concepts for high school and competitive exam aspirants.',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      await updateProfile({
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim(),
        subjectSpecialization: formData.subjectSpecialization.trim(),
        highestQualification: formData.highestQualification.trim(),
        experienceYears: formData.experienceYears.trim(),
        officeHours: formData.officeHours.trim(),
        bio: formData.bio.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
      } as any);
      setSuccessMessage('Faculty profile credentials successfully updated in Firestore.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update educator profile.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Faculty Profile & Preferences
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Teacher Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your faculty credentials, contact information, and teaching specialization.
        </p>
      </div>

      {/* Verification / Status Badge */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-extrabold text-xl text-white shadow-sm flex-shrink-0">
            {(formData.displayName || 'T').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                {formData.displayName || 'Faculty Member'}
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Approved Educator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 font-medium">
          Role: <span className="text-blue-700 font-bold uppercase">{role}</span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Professional Credentials</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Primary Email (Immutable)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs sm:text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Contact Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Subject Specialization
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics, Organic Chemistry"
                value={formData.subjectSpecialization}
                onChange={(e) => setFormData({ ...formData, subjectSpecialization: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Highest Educational Qualification
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. M.Sc. Physics (IIT Delhi) / Ph.D."
                value={formData.highestQualification}
                onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Teaching Experience (Years)
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 8 Years"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Doubt Support & Office Hours
          </label>
          <div className="relative">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Mon-Fri 4:00 PM - 7:00 PM IST"
              value={formData.officeHours}
              onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Educator Bio & Teaching Philosophy
          </label>
          <textarea
            rows={3}
            placeholder="A brief overview of your academic background and teaching philosophy visible to enrolled students..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. New Delhi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              State / Region
            </label>
            <input
              type="text"
              placeholder="e.g. Delhi NCR"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 text-xs sm:text-sm outline-none transition"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm tracking-wide transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherSettings;
