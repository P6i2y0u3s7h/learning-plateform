import { BaseEntity } from './common';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'razorpay';

export interface Payment extends BaseEntity {
  userId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  orderId: string;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  invoiceNumber?: string;
  paidAt?: string;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  refundProcessedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number; // in paise (e.g. 299900 for ₹2,999)
  currency: 'INR';
  keyId: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number; // in INR
}

import type { Enrollment } from './academic';

export interface RazorpayVerificationPayload {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  courseId?: string;
  userId?: string;
}

export interface RazorpayVerificationResult {
  success: boolean;
  payment?: Payment;
  enrollmentId?: string;
  enrollment?: Enrollment;
  error?: string;
  message: string;
  isDuplicate?: boolean;
}
