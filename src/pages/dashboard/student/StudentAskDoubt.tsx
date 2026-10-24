import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  FileQuestion,
  UserCheck,
  Image as ImageIcon,
  X,
  BookOpen,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { courseworkService } from '../../../services/courseworkService';
import type { DoubtTicket } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const COURSE_OPTIONS = [
  { id: 'school-10', title: 'Class 10 CBSE & State Board — Complete Foundation', subjects: ['Mathematics', 'Science (Physics/Chem)', 'Biology', 'Social Science'] },
  { id: 'ent-amu-11', title: 'AMU 11th Science & Diploma Entrance Crash Course', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Indo-Islamic Culture'] },
  { id: 'comp-bpsc-tre', title: 'BPSC TRE 4.0 Teacher Recruitment Examination Master Batch', subjects: ['General Studies', 'Bihar Special', 'Logical Reasoning', 'Pedagogy'] },
  { id: 'school-12-pcm', title: 'Class 12 Science PCM — Board & JEE Foundation', subjects: ['Physics', 'Chemistry', 'Mathematics'] },
];

export const StudentAskDoubt: React.FC = () => {
  useDocumentTitle('Ask a Doubt — Brainstorm Academy');
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<DoubtTicket[]>([]);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState(COURSE_OPTIONS[0].id);
  const [selectedSubject, setSelectedSubject] = useState(COURSE_OPTIONS[0].subjects[0]);
  const [chapterName, setChapterName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCourse = COURSE_OPTIONS.find((c) => c.id === selectedCourseId) || COURSE_OPTIONS[0];

  const loadDoubts = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await courseworkService.getStudentDoubts(user.uid);
      setDoubts(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load doubts:', err);
      setError('Unable to load your doubt tickets.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, [user?.uid]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Only image files (JPG, PNG, WEBP) are supported for textbook/diagram attachments.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image exceeds the 5MB size limit.');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !questionText.trim()) return;

    if (questionText.trim().length < 10) {
      setImageError('Please describe your doubt in at least 10 characters so faculty can assist properly.');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(false);
    setImageError(null);

    try {
      const studentName = userProfile?.displayName || user?.displayName || 'Student';
      const studentEmail = userProfile?.email || user?.email || '';

      await courseworkService.submitDoubt({
        userId: user.uid,
        studentName,
        studentEmail,
        courseId: activeCourse.id,
        courseTitle: activeCourse.title,
        subjectName: selectedSubject,
        chapterName: chapterName.trim() || 'General Concept',
        question: questionText.trim(),
        imageFile: selectedImage,
      });

      setSubmitSuccess(true);
      setQuestionText('');
      setChapterName('');
      removeImage();
      await loadDoubts();

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error submitting doubt:', err);
      setImageError('Failed to post question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return d.status === 'pending' || d.status === 'in_review';
    if (statusFilter === 'resolved') return d.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Academic Helpdesk
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Ask a Doubt & Faculty Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Have a question about a formula, theorem, or textbook problem? Submit it directly to our subject matter experts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ask Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative overflow-hidden text-slate-900">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                New Academic Query
              </h2>
              <p className="text-[11px] text-slate-400">Directly answered by certified educators</p>
            </div>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2 mb-5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Your question has been forwarded to faculty. Track responses below!</span>
            </div>
          )}

          {imageError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{imageError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitDoubt} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const found = COURSE_OPTIONS.find((c) => c.id === e.target.value);
                  if (found) setSelectedSubject(found.subjects[0]);
                }}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-medium"
              >
                {COURSE_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-medium"
                >
                  {activeCourse.subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chapter / Topic (Optional)
                </label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g. Thermodynamics"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Question Details *
              </label>
              <textarea
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Explain what concept, formula step, or question you need clarification on..."
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition leading-relaxed resize-none"
                required
              />
            </div>

            {/* Image Attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attach Image / Diagram (Optional)
              </label>

              {imagePreview ? (
                <div className="relative border border-slate-200 rounded-2xl p-2.5 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Attachment preview"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{selectedImage?.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {selectedImage ? (selectedImage.size / 1024).toFixed(0) + ' KB' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/60 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-300 hover:border-blue-500 rounded-xl py-3 px-4 text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span>Attach snapshot of problem or diagram</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{submitting ? 'Submitting Question...' : 'Post Question to Faculty'}</span>
            </button>
          </form>
        </div>

        {/* Doubts History & Faculty Replies */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                My Questions & Faculty Answers
              </h3>
              <p className="text-xs text-slate-500">
                Showing {filteredDoubts.length} {filteredDoubts.length === 1 ? 'ticket' : 'tickets'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'resolved'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center shadow-sm text-slate-900">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600">
                <FileQuestion className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                No Doubts Recorded
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {statusFilter === 'all'
                  ? 'Ask any question using the form to receive customized faculty explanations.'
                  : `No doubts in the "${statusFilter}" category.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDoubts.map((d) => {
                const isResolved = d.status === 'resolved';
                const isInReview = d.status === 'in_review';

                return (
                  <div
                    key={d.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-blue-400 transition-all space-y-4 text-slate-900"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {d.subjectName}
                        </span>
                        {d.chapterName && (
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            • {d.chapterName}
                          </span>
                        )}
                      </div>

                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Resolved
                        </span>
                      ) : isInReview ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          Under Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                      <p className="font-semibold">{d.question}</p>
                    </div>

                    {d.attachmentUrls && d.attachmentUrls.length > 0 && (
                      <div className="pt-1">
                        <a
                          href={d.attachmentUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl font-medium transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Question Attachment</span>
                        </a>
                      </div>
                    )}

                    {/* Faculty Answer Box */}
                    {d.facultyReply ? (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <span>Faculty Response: {d.repliedByName || 'Academic Mentor'}</span>
                          </span>
                          <span className="text-[11px] text-emerald-600">
                            {d.repliedAt ? new Date(d.repliedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-emerald-500 font-sans">
                          {d.facultyReply}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 italic">
                        Turnaround: Faculty mentors usually respond within 4–6 business hours.
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>Course: {d.courseTitle || 'Curriculum'}</span>
                      <span>{new Date(d.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAskDoubt;
