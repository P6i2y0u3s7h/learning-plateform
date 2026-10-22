import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Paperclip,
  Download,
  Award,
  UserCheck,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { courseworkService } from '../../../services/courseworkService';
import type { Assignment, AssignmentSubmission } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: AssignmentSubmission;
}

const ITEMS_PER_PAGE = 6;
const DEFAULT_ALLOWED_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
const MAX_FILE_SIZE_MB = 10;

export const StudentAssignments: React.FC = () => {
  useDocumentTitle('Assignments & Submissions — Brainstorm Academy');
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Submit & Review Modal state
  const [activeItem, setActiveItem] = useState<AssignmentWithSubmission | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [assignList, subList] = await Promise.all([
        courseworkService.getAssignments(),
        courseworkService.getStudentSubmissions(user.uid),
      ]);

      const subMap = new Map<string, AssignmentSubmission>();
      subList.forEach((s) => subMap.set(s.assignmentId, s));

      const combined: AssignmentWithSubmission[] = assignList.map((a) => ({
        assignment: a,
        submission: subMap.get(a.id),
      }));

      setAssignments(combined);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Unable to load assignments right now.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(({ submission }) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return !submission;
      if (statusFilter === 'submitted') return submission && submission.status === 'submitted';
      if (statusFilter === 'graded') return submission && submission.status === 'graded';
      return true;
    });
  }, [assignments, statusFilter]);

  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssignments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssignments, currentPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Check size limit
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setFileError(`File size (${sizeMb.toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      setSelectedFile(null);
      return;
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowed = activeItem?.assignment.permittedFileTypes || DEFAULT_ALLOWED_TYPES;
    if (!allowed.some((a) => a.toLowerCase() === ext)) {
      setFileError(`Invalid file format. Permitted: ${allowed.join(', ')}`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const openSubmitModal = (item: AssignmentWithSubmission) => {
    setActiveItem(item);
    setAnswerText(item.submission?.answerText || item.submission?.notes || '');
    setExternalUrl(item.submission?.submissionUrls?.[0] || '');
    setSelectedFile(null);
    setFileError(null);
    setSubmitSuccess(false);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !user?.uid) return;

    if (!answerText.trim() && !selectedFile && !externalUrl.trim()) {
      setFileError('Please provide a written response or attach a solution file.');
      return;
    }

    setSubmitting(true);
    setFileError(null);

    try {
      const studentName = userProfile?.displayName || user?.displayName || 'Student';
      const studentEmail = userProfile?.email || user?.email || '';

      await courseworkService.submitAssignmentResponse({
        assignmentId: activeItem.assignment.id,
        userId: user.uid,
        studentName,
        studentEmail,
        answerText: answerText.trim(),
        notes: answerText.trim(),
        file: selectedFile,
        externalUrl: externalUrl.trim(),
      });

      setSubmitSuccess(true);
      await loadData();

      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveItem(null);
      }, 1500);
    } catch (err) {
      console.error('Submission failed:', err);
      setFileError('Failed to submit assignment. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 07 // CURRICULUM COURSEWORK ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Assignments & Homework
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Review practice problem sets, upload handwritten solutions, and inspect faculty feedback.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex items-center gap-2 overflow-x-auto font-mono text-xs">
        <button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'all'
              ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All ({assignments.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'pending'
              ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setStatusFilter('submitted');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'submitted'
              ? 'bg-[#38BDF8] text-black border-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Submitted
        </button>
        <button
          onClick={() => {
            setStatusFilter('graded');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'graded'
              ? 'bg-emerald-400 text-black border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Graded
        </button>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            No Assignments Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-sm mx-auto mb-4 leading-relaxed">
            {assignments.length === 0
              ? 'You do not have any pending assignments at this time. Great job staying on track!'
              : 'No coursework matches your selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedAssignments.map((item) => {
              const { assignment, submission } = item;
              const isGraded = submission?.status === 'graded';
              const isSubmitted = !!submission;

              // Deadline calculations
              const dueDateObj = assignment.dueDate ? new Date(assignment.dueDate) : null;
              const isOverdue = dueDateObj ? Date.now() > dueDateObj.getTime() && !isSubmitted : false;
              const daysLeft = dueDateObj
                ? Math.ceil((dueDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={assignment.id}
                  className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl hover:border-[#CCFF00]/40 transition-all flex flex-col justify-between group text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="text-[11px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Max Marks: {assignment.totalMarks || 50}
                      </span>
                      {isGraded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <Award className="w-3 h-3" />
                          Graded: {submission?.grade} / {assignment.totalMarks}
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-0.5 rounded-full border border-[#38BDF8]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Submitted
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                          <Clock className="w-3 h-3" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          {daysLeft !== null && daysLeft >= 0 ? `Due in ${daysLeft}d` : 'Pending'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-mono font-bold text-base text-white group-hover:text-[#CCFF00] transition mb-1.5 line-clamp-2">
                      {assignment.title}
                    </h3>

                    {assignment.subjectName && (
                      <p className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wide">
                        {assignment.subjectName} • {assignment.chapterName || 'Module'}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-4 leading-relaxed">
                      {assignment.instructions || 'Review the attached worksheet and submit your answers.'}
                    </p>

                    {/* Attached Resources */}
                    {assignment.attachmentUrls && assignment.attachmentUrls.length > 0 && (
                      <div className="mb-4">
                        <a
                          href={assignment.attachmentUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 hover:bg-[#38BDF8] hover:text-black px-3 py-1.5 rounded-xl transition"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{assignment.attachmentNames?.[0] || 'Teacher Worksheet (PDF)'}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                      </div>
                    )}

                    {/* Due Date & Faculty Details */}
                    <div className="bg-[#060C17] rounded-2xl p-3.5 text-xs font-mono text-slate-300 space-y-1.5 mb-5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Due Date:</span>
                        <span className={`font-bold ${isOverdue ? 'text-rose-400' : 'text-[#CCFF00]'}`}>
                          {dueDateObj ? dueDateObj.toLocaleDateString() : 'Flexible'}
                        </span>
                      </div>
                      {assignment.teacherName && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Instructor:</span>
                          <span className="text-slate-200">{assignment.teacherName}</span>
                        </div>
                      )}
                      {submission?.feedback && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Faculty Evaluation:</span>
                          </p>
                          <p className="italic text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                            "{submission.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {isSubmitted ? (
                      <button
                        onClick={() => openSubmitModal(item)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/15 border border-[#38BDF8]/30 hover:bg-[#38BDF8] hover:text-black transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>{isGraded ? 'Review Score & Feedback' : 'View Submitted Answer'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openSubmitModal(item)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.25)] flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-black" />
                        <span>Submit Solution</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono text-xs text-slate-400">
              <p>
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                      currentPage === p
                        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission & Feedback Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0E121A] rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[11px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Max Marks: {activeItem.assignment.totalMarks}
              </span>
              <h3 className="font-mono font-black text-xl text-white mt-2 mb-1 tracking-tight">
                {activeItem.assignment.title}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                {activeItem.assignment.instructions}
              </p>
            </div>

            {/* If already submitted: show review view */}
            {activeItem.submission ? (
              <div className="space-y-4">
                {activeItem.submission.status === 'graded' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400" />
                        Graded Assignment Result
                      </span>
                      <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-xl shadow-xs border border-emerald-500/30">
                        {activeItem.submission.grade} / {activeItem.assignment.totalMarks} Marks
                      </span>
                    </div>
                    {activeItem.submission.feedback && (
                      <div className="bg-[#060C17] border border-white/10 rounded-xl p-3 text-xs text-slate-200 mt-2 font-sans">
                        <p className="font-mono font-bold text-emerald-400 mb-0.5">Faculty Feedback:</p>
                        <p className="italic text-slate-300 leading-relaxed">{activeItem.submission.feedback}</p>
                      </div>
                    )}
                    {activeItem.submission.gradedByName && (
                      <p className="text-[11px] font-mono text-emerald-400 mt-2 text-right">
                        Evaluated by <strong>{activeItem.submission.gradedByName}</strong> on{' '}
                        {activeItem.submission.gradedAt ? new Date(activeItem.submission.gradedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-4 bg-[#060C17] border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#CCFF00]">Your Submission</span>
                    <span className="text-slate-500">
                      Submitted: {new Date(activeItem.submission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {activeItem.submission.answerText && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {activeItem.submission.answerText}
                    </div>
                  )}

                  {activeItem.submission.submissionUrls && activeItem.submission.submissionUrls.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        Attached Files / Links:
                      </p>
                      {activeItem.submission.submissionUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 hover:bg-[#38BDF8] hover:text-black px-3 py-2 rounded-xl transition mr-2 mb-2 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{activeItem.submission?.attachmentNames?.[idx] || `Uploaded File #${idx + 1}`}</span>
                          <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* If not yet submitted: submission form */
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                {submitSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-mono font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Assignment solution submitted successfully!</span>
                  </div>
                )}

                {fileError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Written Explanation or Solution Text
                  </label>
                  <textarea
                    rows={4}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your step-by-step mathematical derivation or solution notes..."
                    className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#CCFF00] font-sans"
                  />
                </div>

                {/* File Upload Attachment */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Upload Solution Document (PDF, JPG, PNG, DOCX — Max 10MB)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-[#CCFF00] rounded-2xl p-4 text-center cursor-pointer bg-[#060C17]/60 hover:bg-[#CCFF00]/5 transition group"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1.5 text-slate-500 group-hover:text-[#CCFF00] transition" />
                    {selectedFile ? (
                      <p className="text-xs font-mono font-bold text-[#CCFF00]">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-mono font-bold text-white">Click to select handwritten scan or solution file</p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">Supports PDF, PNG, JPG, DOCX</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Or Share External Document Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full py-2 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#CCFF00] font-sans"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition cursor-pointer disabled:opacity-50 active:scale-95 shadow-[0_0_15px_rgba(204,255,0,0.25)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting to Faculty...' : 'Submit Assignment'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
