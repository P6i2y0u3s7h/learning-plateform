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
  Image as ImageIcon,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { courseworkService } from '../../../services/courseworkService';
import { cacheManager } from '../../../utils/cacheManager';
import type { DoubtTicket } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const TeacherDoubts: React.FC = () => {
  useDocumentTitle('Student Doubt Support — Teacher Desk');
  const { user, userProfile } = useAuth();

  const cachedDoubts = cacheManager.get<DoubtTicket[]>('doubts:teacher:all');

  const [loading, setLoading] = useState(() => !cachedDoubts);
  const [error, setError] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<DoubtTicket[]>(() => cachedDoubts || []);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_review' | 'resolved'>('all');

  // Reply Modal
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'in_review' | 'resolved'>('resolved');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const fetchDoubts = React.useCallback(async (isMountedCheck: () => boolean = () => true) => {
    try {
      if (doubts.length === 0) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<DoubtTicket[]>((_, reject) =>
        setTimeout(() => reject(new Error('Doubts fetch timed out')), 8000)
      );

      const list = await Promise.race([courseworkService.getAllDoubtsForTeacher(), timeoutPromise]);
      if (isMountedCheck()) {
        setDoubts(list);
      }
    } catch (err) {
      if (isMountedCheck()) {
        console.warn('Error loading doubts for teacher:', err);
        if (doubts.length === 0) {
          setError('Failed to fetch doubts.');
        }
      }
    } finally {
      if (isMountedCheck()) {
        setLoading(false);
      }
    }
  }, [doubts.length]);

  useEffect(() => {
    let isMounted = true;
    fetchDoubts(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchDoubts]);

  const handleOpenReply = (doubt: DoubtTicket) => {
    setSelectedDoubt(doubt);
    setReplyText(doubt.facultyReply || '');
    setReplyStatus(doubt.status === 'in_review' ? 'in_review' : 'resolved');
    setReplySuccess(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubt || !replyText.trim()) return;

    setSubmittingReply(true);
    setReplySuccess(false);

    try {
      const teacherName = userProfile?.displayName || user?.displayName || 'Faculty Member';
      await courseworkService.replyToDoubt(
        selectedDoubt.id,
        replyText.trim(),
        user?.uid || 'teacher_01',
        teacherName,
        replyStatus
      );

      setReplySuccess(true);

      // Update state
      setDoubts((prev) =>
        prev.map((d) =>
          d.id === selectedDoubt.id
            ? {
                ...d,
                facultyReply: replyText.trim(),
                status: replyStatus,
                repliedByName: teacherName,
                repliedAt: new Date().toISOString(),
              }
            : d
        )
      );

      setTimeout(() => {
        setReplySuccess(false);
        setSelectedDoubt(null);
      }, 1500);
    } catch (err) {
      alert('Failed to send reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    const matchesSearch =
      d.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.courseTitle && d.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? d.status === 'pending'
        : statusFilter === 'in_review'
        ? d.status === 'in_review'
        : d.status === 'resolved';

    return matchesSearch && matchesStatus;
  });

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Student Doubt Resolution
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Student Doubt Resolution
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Address student inquiries, clarify challenging concepts, and provide guided step-by-step solutions.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl text-xs font-semibold shadow-xs self-start sm:self-auto">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Pending Inquiries</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, question, course..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            All ({doubts.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-slate-100'
            }`}
          >
            Pending ({doubts.filter((d) => d.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('in_review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
              statusFilter === 'in_review'
                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            In Review
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Doubts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">
            All Doubts Resolved
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no student doubt tickets requiring faculty action matching your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => {
            const isResolved = doubt.status === 'resolved';
            const isInReview = doubt.status === 'in_review';

            return (
              <div
                key={doubt.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all space-y-4 text-slate-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {doubt.subjectName}
                    </span>
                    <span className="text-xs text-slate-900 font-bold">
                      {doubt.studentName}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({doubt.studentEmail})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Resolved
                      </span>
                    ) : isInReview ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        <Clock className="w-3 h-3 text-blue-600" />
                        In Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Reply
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenReply(doubt)}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      {doubt.facultyReply ? 'Edit Answer' : 'Answer Question'}
                    </button>
                  </div>
                </div>

                <div className="text-xs leading-relaxed space-y-1.5">
                  <p className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">Question Statement:</p>
                  <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                    {doubt.question}
                  </p>
                </div>

                {doubt.attachmentUrls && doubt.attachmentUrls.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Student Attached Diagram / Equation:
                    </p>
                    <a
                      href={doubt.attachmentUrls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition shadow-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{doubt.attachmentNames?.[0] || 'View Attached Image'}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  </div>
                )}

                {/* Faculty Reply Box */}
                {doubt.facultyReply && (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Faculty Reply: {doubt.repliedByName || 'Faculty Member'}</span>
                      </span>
                      <span className="text-[11px] text-emerald-600">
                        {doubt.repliedAt ? new Date(doubt.repliedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-emerald-500">
                      {doubt.facultyReply}
                    </p>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Course: {doubt.courseTitle || 'Curriculum Course'}</span>
                  <span>Asked: {new Date(doubt.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {selectedDoubt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setSelectedDoubt(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-2 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Faculty Response Desk
            </div>

            <h3 className="font-bold text-xl text-slate-900 mb-1">
              Respond to Student Question
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <strong className="text-slate-900">{selectedDoubt.studentName}</strong> • Subject: <strong className="text-slate-900">{selectedDoubt.subjectName}</strong>
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 mb-4 space-y-1.5">
              <p className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">Question:</p>
              <p className="leading-relaxed whitespace-pre-wrap">{selectedDoubt.question}</p>
            </div>

            {replySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Response dispatched to student dashboard successfully!</span>
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Faculty Explanation & Detailed Derivation
                </label>
                <textarea
                  rows={6}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide step-by-step mathematical reasoning, theorem citations, and clear guidance..."
                  className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 leading-relaxed transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Resolution Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={replyStatus === 'resolved'}
                      onChange={() => setReplyStatus('resolved')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-emerald-700 font-semibold">Mark as Resolved</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={replyStatus === 'in_review'}
                      onChange={() => setReplyStatus('in_review')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-blue-700 font-semibold">Under Active Review</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedDoubt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Sending Response...' : 'Post Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDoubts;
