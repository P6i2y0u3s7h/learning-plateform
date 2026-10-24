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
    <div className="space-y-6">
      {/* Header Banner - EduCore Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Billing & Receipts
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Payment & Fee History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your course enrollment fees, transaction receipts, and digital invoice records.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All ({payments.length})
        </button>
        <button
          onClick={() => {
            setStatusFilter('success');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
            statusFilter === 'success'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Successful
        </button>
        <button
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-sm relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-xs">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2">
            No Transactions Recorded
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {payments.length === 0
              ? 'When you enroll in premium courses or test batches, your billing receipts and GST invoices will be logged here.'
              : 'No transactions match your current status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 sm:px-6 text-xs font-bold text-blue-600 font-mono">
                        {p.invoiceNumber || p.id.slice(0, 10).toUpperCase()}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">{p.courseTitle}</td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ₹{p.amount?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="py-4 px-4 uppercase text-xs text-slate-500">
                        {p.paymentMethod || 'Online UPI'}
                      </td>
                      <td className="py-4 px-4">
                        {p.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Success
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition cursor-pointer"
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
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs text-slate-500">
              <p>
                Showing page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === p
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
