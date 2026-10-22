import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  KeyRound,
  Trash2,
  Edit2,
  Mail,
  Shield,
  UserX,
  UserCheck,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  listenToUsersByRole,
  toggleUserStatus,
  updateUserName,
  deleteUserAccount,
  sendUserPasswordReset,
} from '../../../services/adminAccountService';
import type { RtdbUserRecord } from '../../../firebase/rtdb';
import { AddUserModal } from '../../../components/admin/AddUserModal';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminAdmins: React.FC = () => {
  useDocumentTitle('Administrator Access Control — Super Admin');
  const { user: currentAuthUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<RtdbUserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<RtdbUserRecord | null>(null);
  const [newName, setNewName] = useState('');
  const [viewingAdmin, setViewingAdmin] = useState<RtdbUserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Establish Real-Time Firebase Realtime Database Listener (Requirement #7)
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = listenToUsersByRole(
      'admin',
      (adminList) => {
        setAdmins(adminList);
        setLoading(false);
      },
      (err) => {
        console.error('[AdminAdmins] RTDB onValue error:', err);
        setError('Failed to sync administrators from Realtime Database.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.uid && a.uid.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return a.status === 'active';
      if (statusFilter === 'disabled') return a.status === 'disabled';
      return true;
    });
  }, [admins, searchQuery, statusFilter]);

  // Statistics
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === 'active').length;
  const disabledAdmins = admins.filter((a) => a.status === 'disabled').length;

  // Toggle Account Status
  const handleToggleStatus = async (adminRecord: RtdbUserRecord) => {
    const isCurrentAdmin = adminRecord.uid === currentAuthUser?.uid;
    if (isCurrentAdmin && adminRecord.status === 'active') {
      alert('Security Protection: You cannot disable your own active administrator account.');
      return;
    }

    if (adminRecord.status === 'active' && activeAdmins <= 1) {
      alert('Security Protection: Cannot disable the only remaining active administrator.');
      return;
    }

    const nextAction = adminRecord.status === 'active' ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${nextAction} administrator account for "${adminRecord.name}" (${adminRecord.email})?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await toggleUserStatus(adminRecord.uid, adminRecord.status, 'admin');
    } catch (err: any) {
      alert(err?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !newName.trim()) return;

    setActionLoading(true);
    try {
      await updateUserName(editingAdmin.uid, newName.trim());
      setEditingAdmin(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to update name.');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Password Reset
  const handleSendPasswordReset = async (email: string) => {
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    try {
      await sendUserPasswordReset(email);
      alert(`Password reset instructions sent to ${email}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to send password reset email.');
    }
  };

  // Delete Account
  const handleDeleteAdmin = async (adminRecord: RtdbUserRecord) => {
    if (adminRecord.uid === currentAuthUser?.uid) {
      alert('Security Violation: You cannot delete your own administrator account.');
      return;
    }

    if (totalAdmins <= 1) {
      alert('Security Violation: Cannot delete the only remaining administrator account.');
      return;
    }

    const confirmation = window.prompt(
      `PERMANENT ACTION: To delete administrator "${adminRecord.name}", type "DELETE" below:`
    );
    if (confirmation !== 'DELETE') return;

    setActionLoading(true);
    try {
      await deleteUserAccount(adminRecord.uid, 'admin');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete account.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#CCFF00]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] flex items-center justify-center font-mono font-black text-xl shadow-[0_0_20px_rgba(204,255,0,0.25)] flex-shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#CCFF00] uppercase font-bold">
                [ ACCESS CONTROL &middot; ADMINISTRATOR MANAGEMENT ]
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Manage Administrators
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              Synchronized with Firebase Realtime Database (/users where role == 'admin')
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E121A]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-2">
            <span>TOTAL ADMINISTRATORS</span>
            <Shield className="w-4 h-4 text-[#CCFF00]" />
          </div>
          <p className="font-display font-black text-2xl text-white">{totalAdmins}</p>
          <p className="text-[11px] font-mono text-slate-500 mt-1">Provisioned in Realtime DB</p>
        </div>

        <div className="bg-[#0E121A]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-2">
            <span>ACTIVE STATUS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display font-black text-2xl text-emerald-400">{activeAdmins}</p>
          <p className="text-[11px] font-mono text-slate-500 mt-1">Full dashboard permissions</p>
        </div>

        <div className="bg-[#0E121A]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-2">
            <span>SUSPENDED</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="font-display font-black text-2xl text-rose-400">{disabledAdmins}</p>
          <p className="text-[11px] font-mono text-slate-500 mt-1">Login blocked</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0E121A]/80 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name, email, or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 focus:border-[#CCFF00] rounded-xl text-white text-xs outline-none transition font-sans placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-black/40 border border-white/10 rounded-xl font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({totalAdmins})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'active' ? 'bg-[#CCFF00] text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({activeAdmins})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('disabled')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'disabled' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Disabled ({disabledAdmins})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-[#0E121A]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-bold">Administrator</th>
                <th className="py-3.5 px-4 font-bold">Email Address</th>
                <th className="py-3.5 px-4 font-bold">Role</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Date Created</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-4">
                      <Skeleton className="h-6 w-full bg-white/5 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#CCFF00]" />
                    <span>No administrator accounts match your criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((item) => {
                  const isCurrentAuthUser = item.uid === currentAuthUser?.uid;
                  return (
                    <tr key={item.uid} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#CCFF00] to-emerald-400 text-black flex items-center justify-center font-mono font-black text-xs flex-shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-1.5 truncate">
                              <span>{item.name}</span>
                              {isCurrentAuthUser && (
                                <span className="bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 truncate block">
                              UID: {item.uid.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {item.email}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
                          <ShieldCheck className="w-3 h-3" />
                          <span>ADMIN</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>DISABLED</span>
                          </span>
                        )}
                      </td>

                      {/* Date Created */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewingAdmin(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Name */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAdmin(item);
                              setNewName(item.name);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                            title="Edit Name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Password Reset */}
                          <button
                            type="button"
                            onClick={() => handleSendPasswordReset(item.email)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                            title="Send Password Reset Email"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Toggle Active / Disabled */}
                          <button
                            type="button"
                            disabled={actionLoading || (isCurrentAuthUser && item.status === 'active')}
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-lg transition ${
                              item.status === 'active'
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            } ${isCurrentAuthUser ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={
                              isCurrentAuthUser
                                ? 'Cannot disable yourself'
                                : item.status === 'active'
                                ? 'Deactivate Administrator'
                                : 'Activate Administrator'
                            }
                          >
                            {item.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete Account */}
                          <button
                            type="button"
                            disabled={actionLoading || isCurrentAuthUser || totalAdmins <= 1}
                            onClick={() => handleDeleteAdmin(item)}
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ${
                              isCurrentAuthUser || totalAdmins <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title={
                              isCurrentAuthUser
                                ? 'Cannot delete yourself'
                                : totalAdmins <= 1
                                ? 'Cannot delete last admin'
                                : 'Delete Administrator'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Administrator Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultRole="admin"
        onSuccess={() => {}}
      />

      {/* Edit Name Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm">Edit Administrator Name</h3>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-[#CCFF00] rounded-xl text-white text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#CCFF00] text-black hover:bg-white transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Drawer/Modal */}
      {viewingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0E121A] border border-white/10 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
                <h3 className="font-bold text-sm text-white">Administrator Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingAdmin(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-black/40 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500">Name: </span>
                <span className="text-white font-bold">{viewingAdmin.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Email: </span>
                <span className="text-slate-200">{viewingAdmin.email}</span>
              </div>
              <div>
                <span className="text-slate-500">UID: </span>
                <span className="text-[#CCFF00] select-all">{viewingAdmin.uid}</span>
              </div>
              <div>
                <span className="text-slate-500">Role: </span>
                <span className="uppercase text-emerald-400 font-bold">{viewingAdmin.role}</span>
              </div>
              <div>
                <span className="text-slate-500">Status: </span>
                <span className={viewingAdmin.status === 'active' ? 'text-emerald-400 uppercase font-bold' : 'text-rose-400 uppercase font-bold'}>
                  {viewingAdmin.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Created: </span>
                <span className="text-slate-300">
                  {viewingAdmin.createdAt ? new Date(viewingAdmin.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingAdmin(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmins;
