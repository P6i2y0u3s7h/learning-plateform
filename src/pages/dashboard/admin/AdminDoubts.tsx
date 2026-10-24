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
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Inquiry Pipeline</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Student Doubt Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review conceptual hurdles, delegate questions to faculty subject experts, or submit official explanations.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Inquiries</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Resolved Doubts</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Inquiries</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{doubts.length}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, subject, or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['all', 'pending', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize tracking-wide transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Doubt Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full bg-slate-100 rounded-3xl" />
            <Skeleton className="h-28 w-full bg-slate-100 rounded-3xl" />
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-800">No Student Doubts Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Either all inquiries have been resolved or no tickets match your search filter.
            </p>
          </div>
        ) : (
          filteredDoubts.map((d) => (
            <div
              key={d.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 transition-all hover:border-blue-300 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {d.studentName || 'Student'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.subjectName || 'General Subject'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {d.status === 'resolved' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                      <Clock className="w-3.5 h-3.5" /> PENDING
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Student Question:
                </p>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {d.question}
                </p>
              </div>

              {/* Faculty Solution (if resolved) */}
              {d.facultyReply && (
                <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Solution by {d.repliedByName || 'Faculty Expert'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {d.repliedAt ? new Date(d.repliedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200/80 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Answer Academic Doubt
              </h3>
              <button
                onClick={() => setReplyTarget(null)}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-blue-700">Query from {replyTarget.studentName}:</span>
              <p className="italic text-slate-700">&ldquo;{replyTarget.question}&rdquo;</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Faculty Answer / Derivation
                </label>
                <textarea
                  required
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide step-by-step derivation, theorem explanation, or conceptual breakdown..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
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
