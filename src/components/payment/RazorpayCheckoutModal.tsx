import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { loadRazorpayScript } from '../../utils/razorpay';
import type { Course, RazorpayOrderResponse, Payment } from '../../types';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  course: Course;
  user: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
  onClose: () => void;
  onSuccess: (payment: Payment, enrollmentId: string) => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  course,
  user,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'initiating' | 'checkout' | 'verifying' | 'success' | 'failed' | 'cancelled'>('initiating');
  const [orderData, setOrderData] = useState<RazorpayOrderResponse | null>(null);
  const [verifiedPayment, setVerifiedPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Order on Mount
  useEffect(() => {
    let isMounted = true;

    async function initOrder() {
      if (!isOpen || !course || !user) return;
      setStep('initiating');
      setErrorMessage(null);
      setLoading(true);

      try {
        // Pre-load official Razorpay script in background
        loadRazorpayScript();

        const order = await paymentService.createRazorpayOrder(course.id, user.uid, {
          name: user.displayName || 'Student',
          email: user.email || '',
        });

        if (isMounted) {
          setOrderData(order);
          setStep('checkout');
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[RazorpayCheckoutModal] Order init failed:', err);
          if (err.message?.includes('ALREADY_ENROLLED')) {
            setErrorMessage('You are already actively enrolled in this course.');
          } else {
            setErrorMessage(err.message || 'Failed to initialize payment order.');
          }
          setStep('failed');
          setLoading(false);
        }
      }
    }

    initOrder();
    return () => {
      isMounted = false;
    };
  }, [isOpen, course.id, user.uid]);

  if (!isOpen) return null;

  // 1. Process Successful Verification (Real or Test Mode)
  const handleCompletePayment = async (simulatedPaymentId?: string, simulatedSignature?: string) => {
    if (!orderData) return;
    setStep('verifying');
    setLoading(true);
    setErrorMessage(null);

    try {
      const paymentId = simulatedPaymentId || `pay_test_${Date.now()}`;
      const signature =
        simulatedSignature ||
        (await paymentService.generateTestSignature(orderData.orderId, paymentId));

      const result = await paymentService.verifyPaymentAndEnroll({
        orderId: orderData.orderId,
        paymentId,
        signature,
        courseId: course.id,
        userId: user.uid,
      });

      if (result.success) {
        setVerifiedPayment(result.payment);
        setStep('success');
        onSuccess(result.payment, result.enrollmentId || `enr_${user.uid}_${course.id}`);
      } else {
        throw new Error(result.message || 'Payment verification was rejected.');
      }
    } catch (err: any) {
      console.error('[RazorpayCheckoutModal] Verification error:', err);
      setErrorMessage(err.message || 'Signature verification failed.');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Process Failed Payment Scenario
  const handleSimulateFailure = async () => {
    if (!orderData) return;
    setLoading(true);
    try {
      const reason = 'Issuing bank declined transaction (simulated card failure).';
      await paymentService.handlePaymentFailure(orderData.orderId, reason);
      setErrorMessage(reason);
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Process Fraudulent / Tampered Signature Scenario
  const handleSimulateTamperedSignature = async () => {
    if (!orderData) return;
    setStep('verifying');
    setLoading(true);
    try {
      const paymentId = `pay_tampered_${Date.now()}`;
      const fakeSignature = 'forged_fake_signature_hash_000000000000';

      await paymentService.verifyPaymentAndEnroll({
        orderId: orderData.orderId,
        paymentId,
        signature: fakeSignature,
        courseId: course.id,
        userId: user.uid,
      });
    } catch (err: any) {
      setErrorMessage('Security verification caught forged signature. Unauthorized enrollment blocked!');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Process Cancellation Scenario
  const handleCancelPayment = async () => {
    if (orderData && step === 'checkout') {
      await paymentService.handlePaymentCancelled(orderData.orderId);
    }
    setStep('cancelled');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // 5. Open Official Razorpay Popup (if in browser with script loaded)
  const handleLaunchOfficialRazorpay = () => {
    if (!orderData) return;

    if (typeof (window as any).Razorpay === 'undefined') {
      // Fallback directly to verified test mode
      handleCompletePayment();
      return;
    }

    try {
      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Brainstorm Academy',
        description: course.title,
        order_id: orderData.orderId,
        prefill: {
          name: user.displayName || 'Student',
          email: user.email || '',
        },
        theme: {
          color: '#17365D',
        },
        handler: function (response: any) {
          handleCompletePayment(response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: function () {
            handleCancelPayment();
          },
        },
      });

      rzp.open();
    } catch (e) {
      console.warn('Standard Razorpay popup could not open, falling back to simulator:', e);
      handleCompletePayment();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        {step !== 'verifying' && (
          <button
            onClick={step === 'checkout' ? handleCancelPayment : onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STEP: Initiating Order */}
        {step === 'initiating' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF3FB] text-[#2457A7] flex items-center justify-center mx-auto animate-pulse">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-[#17365D]">
                Connecting to Payment Gateway...
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Validating course availability and creating secure Razorpay test order.
              </p>
            </div>
          </div>
        )}

        {/* STEP: Active Checkout */}
        {step === 'checkout' && orderData && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-[#2457A7] bg-[#EEF3FB] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2457A7]" />
                  Razorpay Secure Checkout
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                  Test Mode
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-[#17365D]">
                {course.title}
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Complete your enrollment to unlock full lectures, notes, and weekly mock exams.
              </p>
            </div>

            {/* Bill Summary Card */}
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span>Course Price:</span>
                <span className="font-semibold text-[#172033]">₹{orderData.coursePrice}</span>
              </div>
              <div className="flex items-center justify-between text-[#6B7280]">
                <span>GST / Platform Fees:</span>
                <span className="font-semibold text-emerald-700">₹0 (Waived)</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm">
                <span className="font-bold text-[#17365D]">Total Payable:</span>
                <span className="font-extrabold text-xl text-[#2457A7]">₹{orderData.coursePrice}</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono pt-1">
                Order ID: {orderData.orderId}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleLaunchOfficialRazorpay}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
            >
              <CreditCard className="w-4 h-4 text-[#F4B942]" />
              <span>Pay ₹{orderData.coursePrice} with Razorpay</span>
            </button>

            {/* Development / Test Mode Sandbox Controls */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" />
                Test Mode Simulation Controls:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleCompletePayment()}
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer text-center"
                >
                  ✓ Simulate Success
                </button>
                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  className="p-2 rounded-lg bg-red-50 text-red-800 font-bold border border-red-200 hover:bg-red-100 transition cursor-pointer text-center"
                >
                  ✕ Simulate Bank Fail
                </button>
                <button
                  type="button"
                  onClick={handleSimulateTamperedSignature}
                  className="p-2 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 hover:bg-amber-100 transition cursor-pointer text-center"
                >
                  ⚠ Test Fake Signature
                </button>
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 font-bold border border-gray-200 hover:bg-gray-200 transition cursor-pointer text-center"
                >
                  ⊘ Simulate Cancel
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-gray-400" />
              <span>256-bit SSL encrypted • Razorpay verified backend signatures</span>
            </p>
          </div>
        )}

        {/* STEP: Verifying Signature */}
        {step === 'verifying' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2457A7] flex items-center justify-center mx-auto animate-spin">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-[#17365D]">
                Verifying Payment Signature...
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-xs mx-auto">
                Running authoritative HMAC-SHA256 signature verification on backend to activate enrollment.
              </p>
            </div>
          </div>
        )}

        {/* STEP: Success & Access Granted */}
        {step === 'success' && verifiedPayment && (
          <div className="py-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                Payment Verified & Enrolled
              </span>
              <h3 className="font-display font-extrabold text-2xl text-[#17365D] mt-2">
                Welcome to the Batch!
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Your transaction was completed and full access has been unlocked.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 text-xs text-left border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Course:</span>
                <span className="font-bold text-[#17365D]">{course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Amount Paid:</span>
                <span className="font-extrabold text-emerald-700">₹{verifiedPayment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Invoice Number:</span>
                <span className="font-semibold text-[#172033]">{verifiedPayment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Transaction ID:</span>
                <span className="font-mono text-[11px] text-gray-600">{verifiedPayment.transactionId}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  navigate(`/dashboard/student/classroom/${course.id}`);
                }}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
              >
                <span>Enter Classroom & Start Learning</span>
                <ArrowRight className="w-4 h-4 text-[#F4B942]" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard/student/payments');
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#2457A7] bg-[#EEF3FB] hover:bg-blue-100 transition cursor-pointer"
              >
                View Invoice in Payment History
              </button>
            </div>
          </div>
        )}

        {/* STEP: Failed */}
        {step === 'failed' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="font-display font-extrabold text-xl text-[#17365D]">
                Payment Unsuccessful
              </h3>
              <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto font-medium">
                {errorMessage || 'The transaction could not be verified by the banking gateway.'}
              </p>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 text-left">
              <p className="font-bold">What happens next?</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-gray-700">
                <li>No course enrollment was granted for this failed attempt.</li>
                <li>If money was deducted from your account, it will automatically be refunded by your bank within 3–5 working days.</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setStep('checkout');
                  setErrorMessage(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#17365D] text-white hover:bg-[#2457A7] transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STEP: Cancelled */}
        {step === 'cancelled' && (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-[#17365D]">
              Payment Cancelled
            </h3>
            <p className="text-xs text-[#6B7280]">
              You can return to complete enrollment whenever you are ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckoutModal;
