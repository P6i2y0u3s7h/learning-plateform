import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Search,
  Filter,
  AlertCircle,
  IndianRupee,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/adminService';
import type { Payment } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const AdminPayments: React.FC = () => {
  useDocumentTitle('Payment Management — Super Admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'refunded' | 'failed'>('all');

  // Confirmation Modals
  const [verifyTarget, setVerifyTarget] = useState<Payment | null>(null);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchPayments() {
      try {
        setLoading(true);
        setError(null);
        const list = await adminService.getPayments();
        if (isMounted) {
          setPayments(list);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[AdminPayments] Error loading payments:', err);
          setError('Failed to fetch transaction records from database.');
          setLoading(false);
        }
      }
    }

    fetchPayments();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setProcessing(true);
    try {
      await adminService.verifyPayment(verifyTarget.id, user?.email || 'admin@brainstorm.edu');
      setPayments((prev) =>
        prev.map((p) =>
          p.id === verifyTarget.id
            ? { ...p, status: 'success', paidAt: new Date().toISOString() }
            : p
        )
      );
      setVerifyTarget(null);
    } catch (err) {
      console.error('[AdminPayments] Error verifying payment:', err);
      alert('Failed to verify payment record.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setProcessing(true);
    try {
      await adminService.refundPayment(refundTarget.id, user?.email || 'admin@brainstorm.edu');
      setPayments((prev) =>
        prev.map((p) =>
          p.id === refundTarget.id ? { ...p, status: 'refunded' } : p
        )
      );
      setRefundTarget(null);
    } catch (err) {
      console.error('[AdminPayments] Error refunding payment:', err);
      alert('Failed to process refund.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculations
  const verifiedRevenue = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const verifiedCount = payments.filter((p) => p.status === 'success').length;
  const refundedCount = payments.filter((p) => p.status === 'refunded').length;

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.orderId?.toLowerCase().includes(q) ||
      p.courseTitle?.toLowerCase().includes(q) ||
      p.userId?.toLowerCase().includes(q) ||
      p.invoiceNumber?.toLowerCase().includes(q) ||
      p.transactionId?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-50 border border-blue-200 text-blue-700">
            <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
            <span>Financial Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payment & Fee Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit student tuition fees, review verified payment proofs, and handle refunds securely.
          </p>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Verified Revenue</p>
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight">
              ₹{verifiedRevenue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Verification</p>
            <p className="text-xl font-extrabold text-amber-600 tracking-tight">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Verified Receipts</p>
            <p className="text-xl font-extrabold text-sky-600 tracking-tight">{verifiedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Refunded</p>
            <p className="text-xl font-extrabold text-rose-600 tracking-tight">{refundedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, course, or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          {(['all', 'success', 'pending', 'refunded', 'failed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === 'success' ? 'Verified' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden text-slate-800">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-800">No payment transactions found</p>
            <p className="text-xs text-slate-500 mt-1">
              Adjust search keywords or status filter to see other financial entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order / Invoice</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Course Enrolled</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>{p.orderId || p.id}</div>
                        {p.invoiceNumber && (
                          <div className="text-[11px] text-slate-400 font-mono">{p.invoiceNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-xs">
                        {p.userId ? p.userId.slice(0, 10) + '...' : 'Guest / System'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {p.courseTitle || 'Course Enrollment'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-500">
                        {p.paymentMethod || 'UPI / Online'}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        ) : p.status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                            <RotateCcw className="w-3 h-3" /> REFUNDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                            <XCircle className="w-3 h-3" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => setVerifyTarget(p)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                            >
                              Verify Proof
                            </button>
                          )}
                          {p.status === 'success' && (
                            <button
                              onClick={() => setRefundTarget(p)}
                              className="px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition cursor-pointer"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify Confirmation Modal */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 text-slate-800 relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Verify Student Payment</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to verify ₹{verifyTarget.amount?.toLocaleString('en-IN')} for{' '}
                <span className="font-semibold text-blue-600">{verifyTarget.courseTitle}</span>?
              </p>
              <p className="text-xs text-slate-500 mt-2">
                This will immediately record the payment as success and log the action in the security audit logs.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {processing ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 text-slate-800 relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Process Tuition Fee Refund</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to refund ₹{refundTarget.amount?.toLocaleString('en-IN')} for Order{' '}
                <span className="font-mono font-semibold text-slate-900">{refundTarget.orderId}</span>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left mt-3">
                <strong>Administrative Notice:</strong> This action changes the transaction status to &lsquo;refunded&rsquo; and logs the refund event into the platform audit trail.
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {processing ? 'Processing...' : 'Authorize Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
