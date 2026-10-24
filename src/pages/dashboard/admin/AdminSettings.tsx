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
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-50 border border-blue-200 text-blue-700">
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            <span>Platform Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Website & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure site identity, contact information, feature flags, and administrative operational modes without touching source code.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
          <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
          <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Branding Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">General Identity & Branding</h2>
                <p className="text-xs text-slate-500">Official platform name, tagline, and homepage notice</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Institution Name / Site Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.siteTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, siteTitle: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Platform Tagline / Slogan
                </label>
                <input
                  type="text"
                  required
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Featured Announcement Banner (Homepage Top Bar)
              </label>
              <input
                type="text"
                value={formData.featuredNotice || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featuredNotice: e.target.value }))
                }
                placeholder="e.g. Special scholarship tests announced for Class 10 & 12 students!"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
              />
            </div>
          </div>

          {/* Contact & Support Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Contact & Support Channels</h2>
                <p className="text-xs text-slate-500">Student inquiries and admissions support desk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Helpline / Admissions Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Operational Feature Toggles */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Platform Controls & Access Flags</h2>
                <p className="text-xs text-slate-500">Enable or restrict student registrations and public access</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {/* Student Registration Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Student Registration Open</p>
                  <p className="text-xs text-slate-500">
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
                    <ToggleRight className="w-9 h-9 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Teacher Registration Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Faculty Application Gateway</p>
                  <p className="text-xs text-slate-500">
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
                    <ToggleRight className="w-9 h-9 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-rose-600">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">
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
                    <ToggleRight className="w-9 h-9 text-rose-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                'Saving Settings...'
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" /> Save Configuration
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
