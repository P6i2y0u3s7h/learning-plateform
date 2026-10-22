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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] text-[#CCFF00] tracking-widest uppercase font-bold bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/20">
            FACULTY PROFILE & PREFERENCES
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-tight">
          Teacher Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
          Manage your faculty credentials, contact information, and teaching specialization.
        </p>
      </div>

      {/* Verification / Status Badge */}
      <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#CCFF00] p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#0E121A] flex items-center justify-center font-display font-black text-xl text-[#CCFF00]">
              {(formData.displayName || 'T').charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-white text-base uppercase">
                {formData.displayName || 'Faculty Member'}
              </h3>
              <span className="font-mono text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/30 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Approved Educator
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          Role: <span className="text-[#CCFF00] font-bold uppercase">{role}</span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-[#0E121A] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="font-display font-bold text-white text-base uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-[#CCFF00]" />
          <span>Professional Credentials</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              Primary Email (Immutable)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17]/60 border border-white/5 text-slate-400 text-xs outline-none font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              Contact Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              Subject Specialization
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics, Organic Chemistry"
                value={formData.subjectSpecialization}
                onChange={(e) => setFormData({ ...formData, subjectSpecialization: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              Highest Educational Qualification
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. M.Sc. Physics (IIT Delhi) / Ph.D."
                value={formData.highestQualification}
                onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              Teaching Experience (Years)
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. 8 Years"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
            Doubt Support & Office Hours
          </label>
          <div className="relative">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. Mon-Fri 4:00 PM - 7:00 PM IST"
              value={formData.officeHours}
              onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
            Educator Bio & Teaching Philosophy
          </label>
          <textarea
            rows={3}
            placeholder="A brief overview of your academic background and teaching philosophy visible to enrolled students..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. New Delhi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1 font-semibold">
              State / Region
            </label>
            <input
              type="text"
              placeholder="e.g. Delhi NCR"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 focus:border-[#CCFF00] text-white text-xs outline-none transition font-sans"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#CCFF00] hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(204,255,0,0.3)] disabled:opacity-50 cursor-pointer"
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
