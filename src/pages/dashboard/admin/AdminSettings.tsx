import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Globe,
  Mail,
  Phone,
  ShieldAlert,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { WebsiteSettings } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminSettings: React.FC = () => {
  useDocumentTitle('Website & System Settings — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<WebsiteSettings>({
    id: 'general',
    siteTitle: 'Brainstorm Academy',
    tagline: 'Learn Today. Lead Tomorrow.',
    contactEmail: 'contact@brainstormacademy.in',
    contactPhone: '+91 98765 43210',
    maintenanceMode: false,
    registrationOpen: true,
    allowTeacherRegistration: true,
    featuredNotice: 'Admissions Open for CBSE Boards & Entrance batches.',
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchSettings() {
      try {
        setLoading(true);
        setError(null);
        const settings = await adminService.getWebsiteSettings();
        if (isMounted) {
          setFormData(settings);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminSettings] Error fetching settings:', err);
          setError('Failed to load system settings.');
          setLoading(false);
        }
      }
    }

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await adminService.updateWebsiteSettings(
        formData,
        user?.email || 'admin@brainstorm.edu'
      );
      setSuccessMsg('Website configuration saved successfully! Platform parameters updated.');
    } catch (err) {
      console.error('[AdminSettings] Error saving settings:', err);
      alert('Failed to update website configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
            [ PLATFORM GOVERNANCE · SYSTEM CONFIGURATION ]
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight mt-1">
          Website & System Settings
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
          Configure site identity, contact information, feature flags, and administrative operational modes without touching source code.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs md:text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Branding Section */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 text-white relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#CCFF00] flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">General Identity & Branding</h2>
                <p className="text-xs text-slate-400">Official platform name, tagline, and homepage notice</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Institution Name / Site Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.siteTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, siteTitle: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Platform Tagline / Slogan
                </label>
                <input
                  type="text"
                  required
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Featured Announcement Banner (Homepage Top Bar)
              </label>
              <input
                type="text"
                value={formData.featuredNotice || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featuredNotice: e.target.value }))
                }
                placeholder="e.g. Special scholarship tests announced for Class 10 & 12 students!"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 text-white placeholder-slate-500 text-xs md:text-sm outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
              />
            </div>
          </div>

          {/* Contact & Support Section */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 text-white relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent" />
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">Contact & Support Channels</h2>
                <p className="text-xs text-slate-400">Student inquiries and admissions support desk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Helpline / Admissions Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060C17] border border-white/15 text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
                />
              </div>
            </div>
          </div>

          {/* Operational Feature Toggles */}
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 text-white relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">Platform Controls & Access Flags</h2>
                <p className="text-xs text-slate-400">Enable or restrict student registrations and public access</p>
              </div>
            </div>

            <div className="divide-y divide-white/5 text-xs md:text-sm">
              {/* Student Registration Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Student Registration Open</p>
                  <p className="text-xs text-slate-400">
                    Allow new candidates to create student accounts and register for courses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      registrationOpen: !prev.registrationOpen,
                    }))
                  }
                  className="text-2xl transition-transform cursor-pointer"
                >
                  {formData.registrationOpen ? (
                    <ToggleRight className="w-9 h-9 text-[#CCFF00]" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Teacher Registration Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Faculty Application Gateway</p>
                  <p className="text-xs text-slate-400">
                    Allow educators to submit teaching applications for administrative vetting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      allowTeacherRegistration: !prev.allowTeacherRegistration,
                    }))
                  }
                  className="text-2xl transition-transform cursor-pointer"
                >
                  {formData.allowTeacherRegistration ? (
                    <ToggleRight className="w-9 h-9 text-[#CCFF00]" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-rose-400">Maintenance Mode</p>
                  <p className="text-xs text-slate-400">
                    Show platform upgrade notice to students while allowing Super Admins access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      maintenanceMode: !prev.maintenanceMode,
                    }))
                  }
                  className="text-2xl transition-transform cursor-pointer"
                >
                  {formData.maintenanceMode ? (
                    <ToggleRight className="w-9 h-9 text-rose-500" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end font-mono">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl text-xs font-bold text-black bg-[#CCFF00] hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                'Saving Settings...'
              ) : (
                <>
                  <Save className="w-4 h-4 text-black" /> Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
