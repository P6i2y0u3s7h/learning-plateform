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
    <div className="space-y-8 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header Banner */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
            [ 11 // ACADEMIC HELPDESK ]
          </span>
        </div>
        <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
          Ask a Doubt & Faculty Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
          Have a question about a formula, theorem, or textbook problem? Submit it directly to our subject matter experts.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-300 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ask Form */}
        <div className="lg:col-span-5 bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden text-white">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#CCFF00]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="font-mono font-bold text-base text-white tracking-tight">
              New Academic Query
            </h2>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 mb-5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              <span>Your question has been forwarded to faculty. Track responses below!</span>
            </div>
          )}

          {imageError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-2xl text-xs font-mono flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{imageError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitDoubt} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const found = COURSE_OPTIONS.find((c) => c.id === e.target.value);
                  if (found) setSelectedSubject(found.subjects[0]);
                }}
                className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition"
              >
                {COURSE_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0E121A] text-white">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs text-white outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition"
                >
                  {activeCourse.subjects.map((s) => (
                    <option key={s} value={s} className="bg-[#0E121A] text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Chapter / Topic (Optional)
                </label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g. Thermodynamics"
                  className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Question Details
              </label>
              <textarea
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Explain what concept, formula step, or question you need clarification on..."
                className="w-full py-2.5 px-3 bg-[#060C17] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition leading-relaxed font-sans"
                required
              />
            </div>

            {/* Image Attachment */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Attach Image / Diagram (Optional)
              </label>

              {imagePreview ? (
                <div className="relative border border-white/15 rounded-2xl p-2.5 bg-[#060C17] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Attachment preview"
                      className="w-12 h-12 object-cover rounded-xl border border-white/15"
                    />
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{selectedImage?.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {selectedImage ? (selectedImage.size / 1024).toFixed(0) + ' KB' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-white/20 hover:border-[#CCFF00] rounded-xl py-3 px-4 text-xs font-medium text-slate-400 hover:text-[#CCFF00] bg-white/[0.02] hover:bg-[#CCFF00]/5 transition flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#CCFF00] hover:bg-white text-black transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 shadow-[0_0_15px_rgba(204,255,0,0.25)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting Question...' : 'Post Question to Faculty'}</span>
            </button>
          </form>
        </div>

        {/* Doubts History & Faculty Replies */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div>
              <h3 className="font-mono font-bold text-base text-white">
                My Questions & Faculty Answers
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Showing {filteredDoubts.length} {filteredDoubts.length === 1 ? 'ticket' : 'tickets'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#060C17] p-1 rounded-xl border border-white/10 self-start sm:self-auto font-mono">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-[#38BDF8] text-black shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'resolved'
                    ? 'bg-[#10B981] text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-10 border border-white/10 text-center shadow-2xl text-white">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#CCFF00]">
                <FileQuestion className="w-7 h-7" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white mb-1">
                No Doubts Recorded
              </h4>
              <p className="text-xs text-slate-400 font-mono max-w-xs mx-auto">
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
                    className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-xl hover:border-white/20 transition-all space-y-4 text-white"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {d.subjectName}
                        </span>
                        {d.chapterName && (
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            • {d.chapterName}
                          </span>
                        )}
                      </div>

                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          RESOLVED
                        </span>
                      ) : isInReview ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-0.5 rounded-full border border-[#38BDF8]/30">
                          <Clock className="w-3 h-3" />
                          UNDER REVIEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/30">
                          <Clock className="w-3 h-3" />
                          PENDING
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      <p className="font-semibold">{d.question}</p>
                    </div>

                    {d.attachmentUrls && d.attachmentUrls.length > 0 && (
                      <div className="pt-1">
                        <a
                          href={d.attachmentUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl font-mono font-semibold transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Question Attachment</span>
                        </a>
                      </div>
                    )}

                    {/* Faculty Answer Box */}
                    {d.facultyReply ? (
                      <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 space-y-2 mt-3 font-mono">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-[#10B981]" />
                            <span>Faculty Response: {d.repliedByName || 'Academic Mentor'}</span>
                          </span>
                          <span className="text-[11px] text-emerald-500/80">
                            {d.repliedAt ? new Date(d.repliedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-[#10B981] font-sans">
                          {d.facultyReply}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-slate-400 font-mono italic">
                        Turnaround: Faculty mentors usually respond within 4–6 business hours.
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-white/10 flex items-center justify-between font-mono">
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
