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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
              [ FINANCIAL LEDGER · TRANSACTION AUDIT ]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight mt-1">
            Payment & Fee Verification
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
            Audit student tuition fees, review verified payment proofs, and handle refunds securely.
          </p>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Verified Revenue</p>
            <p className="text-xl font-bold text-white tracking-tight">
              ₹{verifiedRevenue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Pending Verification</p>
            <p className="text-xl font-bold text-white tracking-tight">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Verified Receipts</p>
            <p className="text-xl font-bold text-white tracking-tight">{verifiedCount}</p>
          </div>
        </div>

        <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Refunded</p>
            <p className="text-xl font-bold text-white tracking-tight">{refundedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center font-mono">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, course, or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs md:text-sm bg-[#060C17] border border-white/15 text-white placeholder-slate-500 outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          {(['all', 'success', 'pending', 'refunded', 'failed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st === 'success' ? 'Verified' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative text-white">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#10B981] to-transparent" />
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono">
            <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-bold text-white">No payment transactions found</p>
            <p className="text-xs text-slate-400 mt-1">
              Adjust search keywords or status filter to see other financial entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-mono font-bold text-[11px] uppercase tracking-wider">
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
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filteredPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-white">
                        <div>{p.orderId || p.id}</div>
                        {p.invoiceNumber && (
                          <div className="text-[11px] text-slate-400">{p.invoiceNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                        {p.userId ? p.userId.slice(0, 10) + '...' : 'Guest / System'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white font-sans">
                        {p.courseTitle || 'Course Enrollment'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#CCFF00]">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-400">
                        {p.paymentMethod || 'UPI / Online'}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Clock className="w-3.5 h-3.5" /> PENDING
                          </span>
                        ) : p.status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            <RotateCcw className="w-3.5 h-3.5" /> REFUNDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => setVerifyTarget(p)}
                              className="px-2.5 py-1 bg-[#CCFF00] text-black rounded-lg text-xs font-mono font-bold hover:bg-white transition-colors cursor-pointer"
                            >
                              Verify Proof
                            </button>
                          )}
                          {p.status === 'success' && (
                            <button
                              onClick={() => setRefundTarget(p)}
                              className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg font-mono font-medium transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-4 text-white relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-center font-mono">
              <h3 className="text-lg font-bold text-white">Verify Student Payment</h3>
              <p className="text-xs text-slate-300 mt-1">
                Are you sure you want to verify ₹{verifyTarget.amount?.toLocaleString('en-IN')} for{' '}
                <span className="font-semibold text-[#CCFF00]">{verifyTarget.courseTitle}</span>?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                This will immediately record the payment as success and log the action in the security audit logs.
              </p>
            </div>
            <div className="flex gap-3 pt-2 font-mono">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                disabled={processing}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={processing}
                className="flex-1 px-4 py-2 text-xs font-bold bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {processing ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D111A]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-4 text-white relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center font-mono">
              <h3 className="text-lg font-bold text-white">Process Tuition Fee Refund</h3>
              <p className="text-xs text-slate-300 mt-1">
                Are you sure you want to refund ₹{refundTarget.amount?.toLocaleString('en-IN')} for Order{' '}
                <span className="font-mono font-semibold text-white">{refundTarget.orderId}</span>?
              </p>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-amber-300 text-left mt-3">
                <strong>Administrative Notice:</strong> This action changes the transaction status to &lsquo;refunded&rsquo; and logs the refund event into the platform audit trail.
              </div>
            </div>
            <div className="flex gap-3 pt-2 font-mono">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                disabled={processing}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={processing}
                className="flex-1 px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
