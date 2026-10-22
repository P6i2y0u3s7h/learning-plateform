import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle2,
  X,
  Menu,
  ShieldAlert,
  Loader2,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { examService } from '../../../services/examService';
import type { ClientSafeQuestion, Test, TestAttempt } from '../../../types';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const StudentExamRoom: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<Omit<Test, 'questions'> & { questions: ClientSafeQuestion[] } | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);

  // Exam Progress State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());

  // Timer & Countdown State (Computed strictly in client memory from attempt.deadline; NO database writes per second)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);

  useDocumentTitle(test ? `${test.title} — Examination Room` : 'Examination Room — Brainstorm Academy');

  // Initialize test and attempt
  useEffect(() => {
    let isMounted = true;
    async function initExam() {
      if (!testId || !user?.uid) return;
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch sanitized test questions (Stripped of correctOptionIds & explanations!)
        const { test: safeTest } = await examService.getClientSafeTest(testId, user.uid);
        
        // 2. Start or resume attempt (server validated startedAt & deadline)
        const { attempt: initialAttempt } = await examService.startOrResumeAttempt(
          testId,
          user.uid,
          user.displayName || 'Student'
        );

        if (!isMounted) return;

        setTest(safeTest);
        setAttempt(initialAttempt);

        // Restore any existing saved answers from database or localStorage fallback
        const localKey = `brainstorm_exam_draft_${initialAttempt.id}`;
        let localDraft: Record<string, string[]> = {};
        try {
          const cached = localStorage.getItem(localKey);
          if (cached) localDraft = JSON.parse(cached);
        } catch (e) {
          /* ignore */
        }

        const mergedAnswers = {
          ...(initialAttempt.savedAnswers || {}),
          ...localDraft,
        };
        setAnswers(mergedAnswers);

        if (initialAttempt.markedForReviewIds) {
          setMarkedForReview(new Set(initialAttempt.markedForReviewIds));
        }

        const initialVisited = new Set(initialAttempt.visitedQuestionIds || []);
        if (safeTest.questions.length > 0) {
          initialVisited.add(safeTest.questions[0].id);
        }
        setVisitedQuestions(initialVisited);

        // Calculate initial remaining seconds based on server-validated deadline
        const deadlineMs = new Date(initialAttempt.deadline).getTime();
        const diffSecs = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
        setSecondsRemaining(diffSecs);

        setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          console.error('[StudentExamRoom] Initialization error:', err);
          setError(err?.message || 'Failed to initialize examination session.');
          setLoading(false);
        }
      }
    }

    initExam();
    return () => {
      isMounted = false;
    };
  }, [testId, user?.uid, user?.displayName]);

  // Main local countdown timer
  useEffect(() => {
    if (!attempt || loading || submitting) return;

    const timer = setInterval(() => {
      const deadlineMs = new Date(attempt.deadline).getTime();
      const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      // Auto-submit at deadline
      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, loading, submitting]);

  // Periodic draft persistence to localStorage and debounced Firestore sync
  const lastSyncRef = useRef<number>(Date.now());
  const syncAnswersToCloud = useCallback(async () => {
    if (!attempt || !user?.uid) return;
    try {
      // Save locally first
      const localKey = `brainstorm_exam_draft_${attempt.id}`;
      localStorage.setItem(localKey, JSON.stringify(answers));

      // Sync to Firestore without countdown writes
      await examService.saveDraftAnswers(
        attempt.id,
        user.uid,
        answers,
        Array.from(markedForReview),
        Array.from(visitedQuestions),
        Math.max(1, (test?.durationMinutes || 60) * 60 - secondsRemaining)
      );
      lastSyncRef.current = Date.now();
    } catch (e) {
      console.warn('[StudentExamRoom] Draft sync warning:', e);
    }
  }, [attempt, user?.uid, answers, markedForReview, visitedQuestions, test?.durationMinutes, secondsRemaining]);

  // Sync draft answers whenever answers change (debounced 1.5s)
  useEffect(() => {
    const handler = setTimeout(() => {
      syncAnswersToCloud();
    }, 1500);
    return () => clearTimeout(handler);
  }, [answers, markedForReview, syncAnswersToCloud]);

  // Auto-submit handler at deadline
  const handleAutoSubmit = async () => {
    if (submitting || !attempt || !user?.uid) return;
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      const timeSpent = Math.max(1, (test?.durationMinutes || 60) * 60 - secondsRemaining);
      const evaluated = await examService.submitTestAttempt(
        attempt.id,
        user.uid,
        answers,
        timeSpent
      );
      // Clear local draft
      try {
        localStorage.removeItem(`brainstorm_exam_draft_${attempt.id}`);
      } catch (e) {
        /* ignore */
      }
      navigate(`/dashboard/student/test-results/${evaluated.id}`, { replace: true });
    } catch (err: any) {
      console.error('[StudentExamRoom] Auto-submit error:', err);
      alert('Examination period ended. Redirecting to evaluation...');
      navigate(`/dashboard/student/test-results/${attempt.id}`, { replace: true });
    }
  };

  // Manual submit action
  const handleManualSubmit = async () => {
    if (submitting || !attempt || !user?.uid) return;
    setSubmitting(true);
    try {
      const timeSpent = Math.max(1, (test?.durationMinutes || 60) * 60 - secondsRemaining);
      const evaluated = await examService.submitTestAttempt(
        attempt.id,
        user.uid,
        answers,
        timeSpent
      );
      try {
        localStorage.removeItem(`brainstorm_exam_draft_${attempt.id}`);
      } catch (e) {
        /* ignore */
      }
      navigate(`/dashboard/student/test-results/${evaluated.id}`, { replace: true });
    } catch (err: any) {
      console.error('[StudentExamRoom] Submission error:', err);
      alert(err?.message || 'Submission failed. Please check your network and retry.');
      setSubmitting(false);
    }
  };

  const currentQuestion = test?.questions[currentQuestionIndex];

  // Question navigation
  const handleSelectQuestion = (index: number) => {
    if (!test || index < 0 || index >= test.questions.length) return;
    const nextQ = test.questions[index];
    setVisitedQuestions((prev) => new Set(prev).add(nextQ.id));
    setCurrentQuestionIndex(index);
    setShowPaletteDrawer(false);
  };

  const handleNext = () => {
    if (!test) return;
    if (currentQuestionIndex < test.questions.length - 1) {
      handleSelectQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      handleSelectQuestion(currentQuestionIndex - 1);
    }
  };

  // Option selection
  const handleToggleOption = (optionId: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const isMulti = currentQuestion.type === 'multiple_choice';

    setAnswers((prev) => {
      const existing = prev[qId] || [];
      if (isMulti) {
        const next = existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId];
        return { ...prev, [qId]: next };
      } else {
        // Single choice selection
        return { ...prev, [qId]: [optionId] };
      }
    });
  };

  // Clear current response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  // Toggle mark for review
  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Format seconds into HH:MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, [secondsRemaining]);

  // Statistics for palette and confirmation modal
  const paletteStats = useMemo(() => {
    if (!test) return { answered: 0, marked: 0, markedAndAnswered: 0, unanswered: 0, notVisited: 0 };
    let answered = 0;
    let marked = 0;
    let markedAndAnswered = 0;
    let notVisited = 0;
    let unanswered = 0;

    for (const q of test.questions) {
      const hasAnswer = (answers[q.id] || []).length > 0;
      const isMarked = markedForReview.has(q.id);
      const isVisited = visitedQuestions.has(q.id);

      if (isMarked && hasAnswer) {
        markedAndAnswered++;
      } else if (isMarked) {
        marked++;
      } else if (hasAnswer) {
        answered++;
      } else if (!isVisited) {
        notVisited++;
      } else {
        unanswered++;
      }
    }

    return { answered, marked, markedAndAnswered, unanswered, notVisited };
  }, [test, answers, markedForReview, visitedQuestions]);

  // Palette item status
  const getQuestionStatus = (qId: string) => {
    const hasAnswer = (answers[qId] || []).length > 0;
    const isMarked = markedForReview.has(qId);
    const isVisited = visitedQuestions.has(qId);

    if (isMarked && hasAnswer) return 'marked_answered';
    if (isMarked) return 'marked';
    if (hasAnswer) return 'answered';
    if (!isVisited) return 'not_visited';
    return 'unanswered';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[#2457A7] animate-spin mb-4" />
        <h2 className="font-display font-bold text-lg text-[#17365D]">
          Preparing Examination Environment
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Loading sanitized question bank and initializing server-validated session...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !test || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="font-display font-bold text-lg text-[#17365D] mb-1">
            Examination Session Unavailable
          </h2>
          <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
            {error || 'The test could not be loaded or eligibility verification failed.'}
          </p>
          <Link
            to="/dashboard/student/tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition"
          >
            Return to Practice Tests
          </Link>
        </div>
      </div>
    );
  }

  const isLowTime = secondsRemaining <= 300; // <= 5 minutes
  const isCriticalTime = secondsRemaining <= 60; // <= 1 minute
  const currentAnswers = answers[currentQuestion.id] || [];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      {/* ======================================================== */}
      {/* 1. TOP SECURE EXAM HEADER                               */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Test Title & Candidate info */}
        <div className="min-w-0 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#EEF3FB] text-[#2457A7] flex items-center justify-center flex-shrink-0 font-bold text-xs">
            MCQ
          </span>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm sm:text-base text-[#17365D] truncate">
              {test.title}
            </h1>
            <p className="text-[11px] text-gray-500 truncate">
              {test.subjectName || 'Exam'} • Question {currentQuestionIndex + 1} of {test.questions.length}
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold transition shadow-xs ${
              isCriticalTime
                ? 'bg-red-500 text-white animate-pulse'
                : isLowTime
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-[#17365D] text-white'
            }`}
            title="Time remaining until automatic submission"
          >
            <Clock className="w-4 h-4 text-[#F4B942]" />
            <span>{formattedTime}</span>
          </div>

          {/* Question Palette Drawer Toggle (Mobile & Tablet) */}
          <button
            onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
            className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            title="View Question Grid"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Submit Test Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#10B981] hover:bg-emerald-600 text-white transition shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN BODY (Question Area + Question Palette Sidebar)  */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Question Section */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between">
            {/* Question Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              {/* Question Header Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#17365D] text-base">
                    Question {currentQuestionIndex + 1}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2457A7]">
                    {currentQuestion.type === 'multiple_choice' ? 'Multiple Answers' : 'Single Choice'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                    +{currentQuestion.marks || 4} Marks
                  </span>
                  {test.negativeMarking && (
                    <span className="text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full font-bold">
                      -{currentQuestion.negativeMarks || 1} Penalty
                    </span>
                  )}
                  <button
                    onClick={handleToggleMarkForReview}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      markedForReview.has(currentQuestion.id)
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-[#172033] leading-relaxed font-medium">
                  {currentQuestion.questionText}
                </p>

                {currentQuestion.questionImage && (
                  <div className="max-w-md rounded-2xl overflow-hidden border border-gray-200">
                    <img
                      src={currentQuestion.questionImage}
                      alt="Question diagram"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = currentAnswers.includes(opt.id);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleOption(opt.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 group ${
                        isSelected
                          ? 'border-[#2457A7] bg-blue-50/60 shadow-xs'
                          : 'border-gray-200 hover:border-blue-200 bg-white hover:bg-gray-50/70'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                          isSelected
                            ? 'bg-[#2457A7] text-white'
                            : 'bg-gray-100 text-[#17365D] group-hover:bg-blue-100'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="text-xs sm:text-sm text-[#172033] font-medium leading-relaxed flex-1">
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Clear Response Button */}
              {currentAnswers.length > 0 && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleClearResponse}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Answer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleMarkForReview();
                    handleNext();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                >
                  Mark & Next
                </button>

                {currentQuestionIndex < test.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition cursor-pointer shadow-xs"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#10B981] text-white hover:bg-emerald-600 transition cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Review & Submit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ======================================================== */}
        {/* 3. QUESTION PALETTE SIDEBAR                             */}
        {/* ======================================================== */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 p-5 flex flex-col justify-between transition-transform duration-300 shadow-xl lg:shadow-none ${
            showPaletteDrawer ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-display font-bold text-sm text-[#17365D] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2457A7]" />
                Question Palette
              </h3>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend Counter */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px]">
                  ✓
                </span>
                <span>Answered: <strong>{paletteStats.answered + paletteStats.markedAndAnswered}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500" />
                <span>Unanswered: <strong>{paletteStats.unanswered}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-600" />
                <span>Marked: <strong>{paletteStats.marked}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-gray-200" />
                <span>Not Visited: <strong>{paletteStats.notVisited}</strong></span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((q, idx) => {
                  const status = getQuestionStatus(q.id);
                  const isCurrent = idx === currentQuestionIndex;

                  let badgeColor = 'bg-gray-100 text-gray-600 hover:bg-gray-200';
                  if (status === 'answered') {
                    badgeColor = 'bg-emerald-500 text-white font-bold';
                  } else if (status === 'marked') {
                    badgeColor = 'bg-purple-600 text-white font-bold';
                  } else if (status === 'marked_answered') {
                    badgeColor = 'bg-purple-600 text-white font-bold ring-2 ring-emerald-400';
                  } else if (status === 'unanswered') {
                    badgeColor = 'bg-amber-500 text-white font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(idx)}
                      className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${badgeColor} ${
                        isCurrent ? 'ring-2 ring-offset-2 ring-[#2457A7] scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Submit in Sidebar */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>Finalize & Submit Test</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 4. SUBMISSION CONFIRMATION MODAL                         */}
      {/* ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-100 shadow-2xl relative">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-[#17365D] mb-2">
              Confirm Test Submission
            </h3>
            <p className="text-xs text-[#6B7280] mb-4">
              Are you sure you want to finalize and evaluate your examination? You cannot modify answers after submission.
            </p>

            {/* Attempt Overview Table */}
            <div className="bg-[#F7F9FC] rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs mb-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Questions</span>
                <strong className="text-[#17365D]">{test.questions.length}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-700">Answered Questions</span>
                <strong className="text-emerald-700">{paletteStats.answered + paletteStats.markedAndAnswered}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-700">Unanswered Questions</span>
                <strong className="text-amber-700">{paletteStats.unanswered + paletteStats.notVisited}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">Marked for Review</span>
                <strong className="text-purple-700">{paletteStats.marked + paletteStats.markedAndAnswered}</strong>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2 font-mono">
                <span className="text-gray-500">Time Left</span>
                <strong className="text-[#17365D]">{formattedTime}</strong>
              </div>
            </div>

            {/* Warning if unanswered */}
            {(paletteStats.unanswered + paletteStats.notVisited) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  You still have <strong>{paletteStats.unanswered + paletteStats.notVisited} unattempted questions</strong>. Unanswered questions will receive 0 marks.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-emerald-600 text-white transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <span>Yes, Submit Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamRoom;
