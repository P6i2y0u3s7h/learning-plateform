import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Search,
  Filter,
  User,
  BookOpen,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { DoubtTicket } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminDoubts: React.FC = () => {
  useDocumentTitle('Doubt Support & Resolution — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<DoubtTicket[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Reply Modal
  const [replyTarget, setReplyTarget] = useState<DoubtTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchDoubts() {
      try {
        setLoading(true);
        setError(null);
        const list = await adminService.getDoubts();
        if (isMounted) {
          setDoubts(list);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminDoubts] Error fetching doubts:', err);
          setError('Failed to fetch student doubt tickets.');
          setLoading(false);
        }
      }
    }

    fetchDoubts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const facultyName = user?.displayName || 'Faculty Admin';
      await adminService.replyToDoubt(
        replyTarget.id,
        replyText.trim(),
        facultyName,
        user?.email || 'admin@brainstorm.edu'
      );

      setDoubts((prev) =>
        prev.map((d) =>
          d.id === replyTarget.id
            ? {
                ...d,
                status: 'resolved',
                facultyReply: replyText.trim(),
                repliedByName: facultyName,
                repliedAt: new Date().toISOString(),
              }
            : d
        )
      );

      setReplyTarget(null);
      setReplyText('');
    } catch (err) {
      console.error('[AdminDoubts] Error replying to doubt:', err);
      alert('Failed to submit faculty answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;
  const resolvedCount = doubts.filter((d) => d.status === 'resolved').length;

  const filteredDoubts = doubts.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      d.question?.toLowerCase().includes(q) ||
      d.studentName?.toLowerCase().includes(q) ||
      d.subjectName?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0E121A]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#CCFF00] text-[11px] font-mono tracking-widest uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>[ INQUIRY PIPELINE · STUDENT DOUBTS ]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
            Student Doubt Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-mono">
            Review conceptual hurdles, delegate questions to faculty subject experts, or submit official explanations.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Pending Inquiries</p>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Resolved Doubts</p>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-sky-400/10 text-sky-300 border border-sky-400/20 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Total Inquiries</p>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">{doubts.length}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student, subject, or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-[#060C17] border border-white/15 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['all', 'pending', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Doubt Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full bg-[#0E121A]/85 rounded-2xl" />
            <Skeleton className="h-28 w-full bg-[#0E121A]/85 rounded-2xl" />
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-12 rounded-2xl border border-white/10 shadow-2xl text-center text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-mono font-bold text-white">No Student Doubts Found</p>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Either all inquiries have been resolved or no tickets match your search filter.
            </p>
          </div>
        ) : (
          filteredDoubts.map((d) => (
            <div
              key={d.id}
              className="bg-[#0E121A]/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 transition-all hover:border-white/20 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/20 to-transparent pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-[#CCFF00] flex items-center justify-center font-bold text-xs font-mono shadow-[0_0_10px_rgba(204,255,0,0.15)]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {d.studentName || 'Student'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>{d.subjectName || 'General Subject'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {d.status === 'resolved' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/10 border border-amber-400/20 text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> PENDING
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                  Student Question:
                </p>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#060C17] p-4 rounded-xl border border-white/10 font-sans">
                  {d.question}
                </p>
              </div>

              {/* Faculty Solution (if resolved) */}
              {d.facultyReply && (
                <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#CCFF00] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solution by {d.repliedByName || 'Faculty Expert'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {d.repliedAt ? new Date(d.repliedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {d.facultyReply}
                  </p>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setReplyTarget(d);
                    setReplyText(d.facultyReply || '');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-[#CCFF00] hover:bg-white hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{d.status === 'resolved' ? 'Edit Solution' : 'Submit Faculty Solution'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-white/15 shadow-2xl space-y-4 relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/50 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#CCFF00]" />
                Answer Academic Doubt
              </h3>
              <button
                onClick={() => setReplyTarget(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#060C17] border border-white/10 rounded-xl text-xs space-y-1">
              <span className="font-mono text-[#CCFF00]">Query from {replyTarget.studentName}:</span>
              <p className="italic text-slate-300">&ldquo;{replyTarget.question}&rdquo;</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Detailed Faculty Answer / Derivation
                </label>
                <textarea
                  required
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide step-by-step derivation, theorem explanation, or conceptual breakdown..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#060C17] text-white text-xs md:text-sm font-sans focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-xs font-mono font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-xs font-mono font-bold text-black bg-[#CCFF00] hover:bg-white hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit & Mark Resolved
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoubts;
