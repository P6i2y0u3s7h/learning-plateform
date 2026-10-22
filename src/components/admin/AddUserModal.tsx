import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Mail,
  User,
} from 'lucide-react';
import {
  createTeacherAccount,
  createAdminAccount,
} from '../../services/adminAccountService';
import type { RtdbUserRecord, AllowedRole } from '../../firebase/rtdb';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'teacher' | 'admin';
  onSuccess?: (user: RtdbUserRecord) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'teacher',
  onSuccess,
}) => {
  const [role, setRole] = useState<'teacher' | 'admin'>(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    uid: string;
    email: string;
    role: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setStatus('active');
      setError(null);
      setCreatedUser(null);
      setCopied(false);
    }
  }, [isOpen, defaultRole]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please provide the user full name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (role === 'teacher') {
        result = await createTeacherAccount({
          name: name.trim(),
          email: email.trim(),
          password,
          status,
        });
      } else {
        result = await createAdminAccount({
          name: name.trim(),
          email: email.trim(),
          password,
          status,
        });
      }

      if (result.success && result.user) {
        setCreatedUser({
          uid: result.uid || result.user.uid,
          email: result.user.email,
          role: result.user.role,
          password,
        });
        if (onSuccess) {
          onSuccess(result.user);
        }
      }
    } catch (err: any) {
      console.error('[AddUserModal] Error:', err);
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    const text = `Brainstorm Academy Credentials\nRole: ${createdUser.role.toUpperCase()}\nEmail: ${createdUser.email}\nPassword: ${createdUser.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0E121A] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 text-white my-8 overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-20 -left-20 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
            role === 'admin' ? 'bg-[#CCFF00]/15' : 'bg-[#10B981]/15'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                role === 'admin'
                  ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]'
                  : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              }`}
            >
              {role === 'admin' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Briefcase className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                {createdUser
                  ? 'Account Ready'
                  : role === 'admin'
                  ? 'Provision Administrator'
                  : 'Provision Faculty Member'}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Firebase Authentication & Realtime Database Integration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Screen */}
        {createdUser ? (
          <div className="py-6 space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Account created successfully!</p>
                <p className="text-slate-300 mt-0.5">
                  The user has been provisioned in Firebase Authentication and their verified role profile is active in Realtime Database.
                </p>
              </div>
            </div>

            {/* Generated Credentials Box */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-2 relative">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-white/10">
                <span>Account Credentials</span>
                <span className="text-[#CCFF00] font-bold">Role: {createdUser.role}</span>
              </div>
              <div className="pt-1 space-y-1">
                <div>
                  <span className="text-slate-500">UID: </span>
                  <span className="text-slate-300 select-all">{createdUser.uid}</span>
                </div>
                <div>
                  <span className="text-slate-500">Email: </span>
                  <span className="text-white font-bold select-all">{createdUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-500">Password: </span>
                  <span className="text-[#CCFF00] font-bold select-all">{createdUser.password}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCredentials}
                className="mt-2 w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials to Clipboard'}</span>
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Account Creation Form */
          <form onSubmit={handleSubmit} className="py-5 space-y-4">
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Target Role
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 px-3 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    role === 'teacher'
                      ? 'bg-[#10B981] text-black font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    role === 'admin'
                      ? 'bg-[#CCFF00] text-black font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Full Name <span className="text-[#CCFF00]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder={role === 'admin' ? 'e.g. Rahul Sharma' : 'e.g. Prof. Vikram Malhotra'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-[#CCFF00] rounded-xl text-white text-xs outline-none transition font-sans placeholder-slate-600"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Email Address <span className="text-[#CCFF00]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder={role === 'admin' ? 'admin@brainstormacademy.in' : 'faculty@brainstorm.edu'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-[#CCFF00] rounded-xl text-white text-xs outline-none transition font-sans placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                  Temporary Password <span className="text-[#CCFF00]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min. 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 focus:border-[#CCFF00] rounded-xl text-white text-xs outline-none transition font-sans placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                  Confirm Password <span className="text-[#CCFF00]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-[#CCFF00] rounded-xl text-white text-xs outline-none transition font-sans placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Account Status Radio */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Initial Account Status
              </label>
              <div className="flex items-center gap-4 text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="accent-[#CCFF00]"
                  />
                  <span className="text-emerald-400 font-bold">Active (Immediate Login)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="disabled"
                    checked={status === 'disabled'}
                    onChange={() => setStatus('disabled')}
                    className="accent-rose-500"
                  />
                  <span className="text-rose-400">Disabled (Suspended)</span>
                </label>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Notice on Session Preservation */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse flex-shrink-0" />
              <span>
                Session Isolation Protected: Creating this account will NOT log out your administrator session.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl font-mono text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`py-2.5 px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer text-black ${
                  role === 'admin'
                    ? 'bg-[#CCFF00] hover:bg-white shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                    : 'bg-[#10B981] hover:bg-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create {role === 'admin' ? 'Admin' : 'Teacher'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddUserModal;
