import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import type { Payment } from '../../../types';
import { Skeleton } from '../../../components/ui/Loading';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 8;

export const StudentPaymentHistory: React.FC = () => {
  useDocumentTitle('Payment & Invoice History — Brainstorm Academy');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getStudentPayments(user.uid);
        if (isMounted) {
          setPayments(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load payments:', err);
          setError('Unable to load payment history.');
          setLoading(false);
        }
      }
    }

    loadPayments();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    });
  }, [payments, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  const handlePrintReceipt = (payment: Payment) => {
    alert(
      `Brainstorm Academy Receipt\nInvoice ID: ${payment.invoiceNumber || payment.id}\nCourse: ${
        payment.courseTitle
      }\nAmount: ₹${payment.amount}\nStatus: ${payment.status.toUpperCase()}`
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Zero-cost GPU accelerated ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(204,255,0,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.04),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest font-bold">
              [ 12 // BILLING & RECEIPTS ]
            </span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Payment & Fee History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Review your course enrollment fees, transaction receipts, and digital invoice records.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-mono shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl flex items-center gap-2 overflow-x-auto font-mono text-xs">
        <button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'all'
              ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All ({payments.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter('success');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'success'
              ? 'bg-emerald-400 text-black border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Successful
        </button>
        <button
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            statusFilter === 'pending'
              ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
          {/* Top specular hairline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#CCFF00]/20 to-[#38BDF8]/20 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="font-mono font-black text-lg sm:text-xl text-white mb-2 tracking-tight">
            No Transactions Recorded
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-sm mx-auto leading-relaxed">
            {payments.length === 0
              ? 'When you enroll in premium courses or test batches, your billing receipts and GST invoices will be logged here.'
              : 'No transactions match your current status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm font-mono">
                <thead className="bg-[#060C17] border-b border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Invoice ID</th>
                    <th className="py-3.5 px-4">Program / Course</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-200">
                  {paginatedPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition">
                      <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-[#38BDF8]">
                        {p.invoiceNumber || p.id.slice(0, 10).toUpperCase()}
                      </td>
                      <td className="py-4 px-4 font-bold text-white">{p.courseTitle}</td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#CCFF00]">
                        ₹{p.amount?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="py-4 px-4 uppercase text-xs text-slate-400">
                        {p.paymentMethod || 'Online UPI'}
                      </td>
                      <td className="py-4 px-4">
                        {p.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/15 border border-[#38BDF8]/30 hover:bg-[#38BDF8] hover:text-black transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl font-mono text-xs text-slate-400">
              <p>
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                      currentPage === p
                        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                        : 'border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPaymentHistory;
