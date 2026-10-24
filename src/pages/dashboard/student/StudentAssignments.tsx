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

      {/* Header - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Curriculum Coursework
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Assignments & Homework
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review practice problem sets, upload handwritten solutions, and inspect faculty feedback.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer border ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All ({assignments.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer border ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setStatusFilter('submitted');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer border ${
            statusFilter === 'submitted'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Submitted
        </button>
        <button
          onClick={() => {
            setStatusFilter('graded');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer border ${
            statusFilter === 'graded'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Graded
        </button>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2 tracking-tight">
            No Assignments Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
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
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Max Marks: {assignment.totalMarks || 50}
                      </span>
                      {isGraded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Award className="w-3 h-3 text-emerald-600" />
                          Graded: {submission?.grade} / {assignment.totalMarks}
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Submitted
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          <Clock className="w-3 h-3 text-red-600" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {daysLeft !== null && daysLeft >= 0 ? `Due in ${daysLeft}d` : 'Pending'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition mb-1.5 line-clamp-2">
                      {assignment.title}
                    </h3>

                    {assignment.subjectName && (
                      <p className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wide">
                        {assignment.subjectName} • {assignment.chapterName || 'Module'}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {assignment.instructions || 'Review the attached worksheet and submit your answers.'}
                    </p>

                    {/* Attached Resources */}
                    {assignment.attachmentUrls && assignment.attachmentUrls.length > 0 && (
                      <div className="mb-4">
                        <a
                          href={assignment.attachmentUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl transition"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{assignment.attachmentNames?.[0] || 'Teacher Worksheet (PDF)'}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                      </div>
                    )}

                    {/* Due Date & Faculty Details */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1.5 mb-5 border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Due Date:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                          {dueDateObj ? dueDateObj.toLocaleDateString() : 'Flexible'}
                        </span>
                      </div>
                      {assignment.teacherName && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Instructor:</span>
                          <span className="text-slate-800 font-medium">{assignment.teacherName}</span>
                        </div>
                      )}
                      {submission?.feedback && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Faculty Evaluation:</span>
                          </p>
                          <p className="italic text-slate-600 text-[11px] mt-0.5 line-clamp-2">
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
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>{isGraded ? 'Review Score & Feedback' : 'View Submitted Answer'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openSubmitModal(item)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-white" />
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
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs text-slate-500 font-medium">
              <p>
                Showing page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === p
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Max Marks: {activeItem.assignment.totalMarks}
              </span>
              <h3 className="font-bold text-xl text-slate-900 mt-2 mb-1 tracking-tight">
                {activeItem.assignment.title}
              </h3>
              <p className="text-xs text-slate-500">
                {activeItem.assignment.instructions}
              </p>
            </div>

            {/* If already submitted: show review view */}
            {activeItem.submission ? (
              <div className="space-y-4">
                {activeItem.submission.status === 'graded' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        Graded Assignment Result
                      </span>
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200">
                        {activeItem.submission.grade} / {activeItem.assignment.totalMarks} Marks
                      </span>
                    </div>
                    {activeItem.submission.feedback && (
                      <div className="bg-white border border-emerald-200 rounded-xl p-3 text-xs text-slate-700 mt-2">
                        <p className="font-semibold text-emerald-800 mb-0.5">Faculty Feedback:</p>
                        <p className="italic text-slate-600 leading-relaxed">{activeItem.submission.feedback}</p>
                      </div>
                    )}
                    {activeItem.submission.gradedByName && (
                      <p className="text-[11px] text-emerald-700 mt-2 text-right">
                        Evaluated by <strong>{activeItem.submission.gradedByName}</strong> on{' '}
                        {activeItem.submission.gradedAt ? new Date(activeItem.submission.gradedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-700">Your Submission</span>
                    <span className="text-slate-500">
                      Submitted: {new Date(activeItem.submission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {activeItem.submission.answerText && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {activeItem.submission.answerText}
                    </div>
                  )}

                  {activeItem.submission.submissionUrls && activeItem.submission.submissionUrls.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Attached Files / Links:
                      </p>
                      {activeItem.submission.submissionUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl transition mr-2 mb-2 shadow-xs"
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
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* If not yet submitted: submission form */
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                {submitSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Assignment solution submitted successfully!</span>
                  </div>
                )}

                {fileError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Written Explanation or Solution Text
                  </label>
                  <textarea
                    rows={4}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your step-by-step mathematical derivation or solution notes..."
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                {/* File Upload Attachment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Upload Solution Document (PDF, JPG, PNG, DOCX — Max 10MB)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-600 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition group"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1.5 text-slate-400 group-hover:text-blue-600 transition" />
                    {selectedFile ? (
                      <p className="text-xs font-semibold text-blue-700">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-800">Click to select handwritten scan or solution file</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG, DOCX</p>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Or Share External Document Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
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
