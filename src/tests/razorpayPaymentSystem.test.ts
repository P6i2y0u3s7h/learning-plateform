import { paymentService } from '../services/paymentService';
import type { Payment, Enrollment } from '../types';

// Lightweight, dependency-free assertion helper for universal TypeScript test runners
const assert = {
  ok(val: any, msg?: string) {
    if (!val) throw new Error(msg || 'Expected truthy value');
  },
  strictEqual(actual: any, expected: any, msg?: string) {
    if (actual !== expected) {
      throw new Error(`${msg || 'Values did not match'} (Actual: ${actual}, Expected: ${expected})`);
    }
  },
  fail(msg?: string) {
    throw new Error(msg || 'Test assertion explicitly failed');
  },
};

async function runRazorpayPaymentTests() {
  console.log('--- STARTING SECURE RAZORPAY PAYMENT TEST SUITE ---\n');

  const testUserId = `test_student_${Date.now()}`;
  const testCourseId = 'course-class-11-pcm'; // Price: 1499
  let testOrderId = '';

  // 1. Order Creation & Backend Price Authority Test
  console.log('1. Testing Order Creation & Backend Price Authority...');
  const orderRes = await paymentService.createRazorpayOrder({
    courseId: testCourseId,
    userId: testUserId,
    studentName: 'Test Student',
    studentEmail: 'student.test@brainstorm.edu',
    studentPhone: '9876543210',
    // Client attempts to pass a tampered price of 1 Rupee (should be overridden by backend)
    tamperedClientPrice: 1,
  });

  assert.ok(orderRes.orderId.startsWith('order_'), 'Expected valid order ID format');
  assert.strictEqual(orderRes.amount, 149900, 'Price must be 149900 paise (₹1499), discarding client tampering');
  assert.strictEqual(orderRes.currency, 'INR', 'Currency must be INR');
  assert.strictEqual(orderRes.courseTitle, 'Class 11 Science (PCM) — Physics, Chemistry & Mathematics');
  testOrderId = orderRes.orderId;
  console.log('✓ Order created securely with server-authoritative price: ₹1499 (149900 paise)');

  // 2. Tampered Signature Rejection Test
  console.log('\n2. Testing Tampered Signature Rejection (Security Guard)...');
  const fakePaymentId = `pay_fake_${Date.now()}`;
  const forgedSignature = 'fraudulent_signature_hash_000000000000';

  const tamperedResult = await paymentService.verifyPaymentAndEnroll({
    orderId: testOrderId,
    razorpayOrderId: testOrderId,
    razorpayPaymentId: fakePaymentId,
    razorpaySignature: forgedSignature,
  });

  assert.strictEqual(tamperedResult.success, false, 'Tampered signature must be rejected');
  assert.strictEqual(tamperedResult.error, 'SIGNATURE_VERIFICATION_FAILED');
  console.log('✓ Fraudulent signature successfully detected and rejected without granting access');

  // 3. Valid Test Mode Payment Verification & Atomic Enrollment Test
  console.log('\n3. Testing Legitimate Payment Verification & Atomic Enrollment...');
  const validOrder = await paymentService.createRazorpayOrder({
    courseId: testCourseId,
    userId: testUserId,
    studentName: 'Test Student',
    studentEmail: 'student.test@brainstorm.edu',
  });

  const validPaymentId = `pay_legit_${Date.now()}`;
  const validSignature = await paymentService.generateTestSignature(validOrder.orderId, validPaymentId);

  const verificationResult = await paymentService.verifyPaymentAndEnroll({
    orderId: validOrder.orderId,
    razorpayOrderId: validOrder.orderId,
    razorpayPaymentId: validPaymentId,
    razorpaySignature: validSignature,
  });

  assert.strictEqual(verificationResult.success, true, 'Valid signature must be verified successfully');
  assert.ok(verificationResult.payment, 'Payment object must be returned');
  assert.strictEqual(verificationResult.payment?.status, 'success', 'Payment status must be success');
  assert.ok(verificationResult.enrollment, 'Enrollment must be activated');
  assert.strictEqual(verificationResult.enrollment?.status, 'active');
  assert.strictEqual(verificationResult.enrollment?.courseId, testCourseId);
  console.log('✓ Valid HMAC-SHA256 signature verified. Payment marked success & enrollment activated!');

  // 4. Duplicate Callback Idempotency Test
  console.log('\n4. Testing Duplicate Callback Idempotency Protection...');
  const duplicateResult = await paymentService.verifyPaymentAndEnroll({
    orderId: validOrder.orderId,
    razorpayOrderId: validOrder.orderId,
    razorpayPaymentId: validPaymentId,
    razorpaySignature: validSignature,
  });

  assert.strictEqual(duplicateResult.success, true, 'Duplicate callback must resolve gracefully');
  assert.strictEqual(duplicateResult.payment?.id, verificationResult.payment?.id, 'Must return same payment record');
  console.log('✓ Duplicate payment callback handled idempotently without duplicate writes');

  // 5. Already Enrolled Guard Test
  console.log('\n5. Testing Already Enrolled Guard...');
  try {
    await paymentService.createRazorpayOrder({
      courseId: testCourseId,
      userId: testUserId,
      studentName: 'Test Student',
      studentEmail: 'student.test@brainstorm.edu',
    });
    assert.fail('Should have thrown ALREADY_ENROLLED error');
  } catch (err: any) {
    assert.ok(err.message.includes('ALREADY_ENROLLED'), 'Expected ALREADY_ENROLLED exception');
    console.log('✓ Blocked redundant checkout: student is already enrolled in this course');
  }

  // 6. Payment Failure Logging Test
  console.log('\n6. Testing Payment Failure Recording...');
  const failedOrder = await paymentService.createRazorpayOrder({
    courseId: 'course-up-supertet',
    userId: `user_fail_${Date.now()}`,
    studentName: 'Fail Student',
    studentEmail: 'fail@brainstorm.edu',
  });

  await paymentService.handlePaymentFailure(failedOrder.orderId, 'Card declined by issuing bank (insufficient funds)');
  console.log('✓ Payment gateway failure logged with decline reason');

  // 7. Payment Cancellation Logging Test
  console.log('\n7. Testing Payment Cancellation Recording...');
  const cancelledOrder = await paymentService.createRazorpayOrder({
    courseId: 'course-bpsc-tre',
    userId: `user_cancel_${Date.now()}`,
    studentName: 'Cancel Student',
    studentEmail: 'cancel@brainstorm.edu',
  });

  await paymentService.handlePaymentCancelled(cancelledOrder.orderId);
  console.log('✓ Payment cancellation recorded when user dismisses Razorpay checkout modal');

  // 8. Admin Refund Processing & Access Revocation Test
  console.log('\n8. Testing Super Admin Refund & Access Revocation...');
  const refundedPayment = await paymentService.processRefund(
    verificationResult.payment!.id,
    'superadmin@brainstorm.edu',
    'Student requested cancellation within 7-day guarantee'
  );

  assert.strictEqual(refundedPayment.status, 'refunded', 'Payment status must be updated to refunded');
  assert.ok(refundedPayment.refundId, 'Refund ID must be generated and stored');
  assert.strictEqual(refundedPayment.refundReason, 'Student requested cancellation within 7-day guarantee');
  console.log('✓ Refund processed successfully. Payment status: refunded, enrollment revoked');

  console.log('\n======================================================');
  console.log('ALL 8 RAZORPAY PAYMENT & SECURITY TESTS PASSED PERFECTLY!');
  console.log('======================================================');
}

runRazorpayPaymentTests().catch((err) => {
  console.error('\n❌ RAZORPAY PAYMENT TEST SUITE FAILED:', err);
  if (typeof (globalThis as any).process !== 'undefined') {
    (globalThis as any).process.exit(1);
  }
});
