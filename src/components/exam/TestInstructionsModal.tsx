import React, { useState, useEffect } from 'react';
import {
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Play,
  X,
  FileText,
  Lock,
  Layers,
} from 'lucide-react';
import type { Test } from '../../types';
import { examService } from '../../services/examService';

interface TestInstructionsModalProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onStartExam: (testId: string) => void;
  userId?: string;
}

export const TestInstructionsModal: React.FC<TestInstructionsModalProps> = ({
  test,
  isOpen,
  onClose,
  onStartExam,
  userId = 'anonymous',
}) => {
  const [agreed, setAgreed] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    reason?: string;
    completedAttemptsCount: number;
  }>({ isEligible: true, completedAttemptsCount: 0 });

  useEffect(() => {
    let isMounted = true;
    async function check() {
      if (!test) return;
      setCheckingEligibility(true);
      try {
        const result = await examService.validateEligibility(test, userId);
        if (isMounted) {
          setEligibility(result);
          setCheckingEligibility(false);
        }
      } catch (err) {
        if (isMounted) {
          setEligibility({ isEligible: true, completedAttemptsCount: 0 });
          setCheckingEligibility(false);
        }
      }
    }

    if (isOpen && test) {
      setAgreed(false);
      check();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, test, userId]);

  if (!isOpen || !test) return null;

  const totalQuestions = test.questionsCount || (test.questions ? test.questions.length : 25);
  const totalMarks = test.totalMarks || 100;
  const passingMarks = test.passingMarks || Math.round(totalMarks * 0.4);
  const marksPerQ = Math.round(totalMarks / totalQuestions) || 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gray-100 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 bg-[#EEF3FB] text-[#2457A7] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            Standard Examination Protocol
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#17365D]">
            {test.title}
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            {test.subjectName || 'Curriculum Assessment'} • {test.classGrade || 'All Students'}
          </p>
        </div>

        {/* Eligibility Alert if blocked */}
        {!checkingEligibility && !eligibility.isEligible && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Test Unavailable</p>
              <p className="mt-0.5 leading-relaxed">{eligibility.reason}</p>
            </div>
          </div>
        )}

        {/* Scrollable Instruction Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs text-[#172033]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-gray-100 text-center">
              <Clock className="w-4 h-4 text-[#2457A7] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase font-bold">Duration</p>
              <p className="font-bold text-[#17365D] text-sm mt-0.5">{test.durationMinutes} Mins</p>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-gray-100 text-center">
              <HelpCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase font-bold">Questions</p>
              <p className="font-bold text-[#17365D] text-sm mt-0.5">{totalQuestions} MCQs</p>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-gray-100 text-center">
              <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase font-bold">Total Marks</p>
              <p className="font-bold text-[#17365D] text-sm mt-0.5">{totalMarks} Pts</p>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-gray-100 text-center">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase font-bold">Pass Marks</p>
              <p className="font-bold text-[#17365D] text-sm mt-0.5">{passingMarks} Pts</p>
            </div>
          </div>

          {/* Marking Scheme */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
            <h4 className="font-bold text-[#17365D] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#2457A7]" />
              Evaluation & Marking Scheme
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Correct Answer: <strong className="text-emerald-700">+{marksPerQ} marks</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>
                  Incorrect Choice:{' '}
                  <strong className="text-red-600">
                    {test.negativeMarking ? '-1 mark (Penalty)' : '0 marks (No penalty)'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Unattempted Questions: <strong>0 marks</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>
                  Attempt Limit:{' '}
                  <strong>{test.attemptLimit ? `${test.attemptLimit} attempt(s)` : 'Unlimited practice'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Rules & Guidelines */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#17365D] text-xs uppercase tracking-wider">
              Examination Rules & Integrity Instructions
            </h4>
            <ul className="space-y-1.5 text-xs text-[#6B7280] list-disc list-inside leading-relaxed">
              <li>The timer starts immediately upon clicking <strong>"Begin Examination"</strong>.</li>
              <li>When the remaining time reaches 00:00, your exam will <strong>automatically submit</strong>.</li>
              <li>You can navigate across questions in any order using the question palette on the right.</li>
              <li>Use <strong>"Mark for Review"</strong> to flag questions you want to double-check before submitting.</li>
              <li>Your answers are saved securely as you progress. If your connection drops temporarily, resume before deadline without losing progress.</li>
              <li>All scores and answer breakdowns will be evaluated on the server after submission.</li>
            </ul>
          </div>

          {/* Acknowledgement Checkbox */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100/80 transition">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={!eligibility.isEligible}
                className="mt-0.5 w-4 h-4 rounded text-[#2457A7] focus:ring-[#2457A7]"
              />
              <span className="text-xs text-[#172033] font-medium leading-snug">
                I have carefully read all examination instructions, understand the negative marking scheme, and agree to maintain academic integrity throughout the test.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => onStartExam(test.id)}
            disabled={!agreed || !eligibility.isEligible}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <Play className="w-4 h-4 fill-[#F4B942] text-[#F4B942]" />
            <span>Begin Examination</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestInstructionsModal;
